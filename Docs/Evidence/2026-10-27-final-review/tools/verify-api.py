"""Final live review. Real LED requests and temporary user125 profile edit.
Never publishes fabricated MQTT readings/status; never deletes database rows.
Credentials/JWT remain in memory. Profile fields are restored in finally.
"""
import base64
import hashlib
import hmac
import json
from pathlib import Path
import time
import sys
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parents[1] / "data"
ENV = dict(line.split("=", 1) for line in (ROOT / "Backend/.env").read_text(
    encoding="utf-8-sig").splitlines() if "=" in line and not line.lstrip().startswith("#"))
BASE = "http://127.0.0.1:8088"
RESULTS = []
COMMANDS = []


def call(path, token=None, body=None, method=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    data = None if body is None else json.dumps(body).encode()
    request = Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urlopen(request, timeout=15) as response:
            return response.status, json.load(response)
    except HTTPError as error:
        try:
            value = json.load(error)
        except Exception:
            value = {}
        return error.code, value


def check(name, condition, **details):
    RESULTS.append({"test": name, "result": "PASS" if condition else "FAIL", **details})
    save()
    if not condition:
        raise AssertionError(name)


def save():
    (OUT / "api-review.json").write_text(json.dumps(
        {"tests": RESULTS, "commands": COMMANDS, "tokensSaved": False},
        ensure_ascii=False, indent=2), encoding="utf-8")


def get(path, token):
    code, body = call(path, token)
    check("GET " + path, code == 200, httpStatus=code)
    return body


def signed_expired_token(subject):
    encode = lambda value: base64.urlsafe_b64encode(json.dumps(value).encode()).rstrip(b"=")
    header = encode({"alg": "HS256", "typ": "JWT"})
    payload = encode({"iss": "iot-backend", "sub": str(subject),
                      "iat": int(time.time()) - 7200, "exp": int(time.time()) - 3600})
    message = header + b"." + payload
    signature = hmac.new(base64.b64decode(ENV["IOT_JWT_SECRET_BASE64"]), message, hashlib.sha256).digest()
    return (message + b"." + base64.urlsafe_b64encode(signature).rstrip(b"=")).decode()


def main():
    tokens = {}
    profiles = {}
    for username in ("user123", "user124", "user125"):
        code, response = call("/api/auth/login", body={"username": username,
                               "password": ENV["IOT_SEED_PASSWORD"]})
        check("Login " + username, code == 200 and bool(response.get("token")))
        tokens[username] = response["token"]
        profiles[username] = get("/api/profile", response["token"])
        check("Profile ownership " + username, profiles[username]["username"] == username)
    main_token = tokens["user123"]
    code, _ = call("/api/auth/login", body={"username": "user123", "password": "invalid-review-password"})
    check("Wrong password rejected", code == 401)
    code, _ = call("/api/auth/login", body={})
    check("Missing login fields rejected", code == 400)
    for path in ("/api/dashboard", "/api/sensor-data", "/api/action-history", "/api/profile"):
        code, _ = call(path)
        check("No token " + path, code == 401)
    code, _ = call("/api/dashboard", "invalid.jwt.token")
    check("Invalid JWT rejected", code == 401)
    code, _ = call("/api/dashboard", signed_expired_token(profiles["user123"]["id"]))
    check("Expired JWT rejected", code == 401)

    dashboard = get("/api/dashboard", main_token)
    (OUT / "dashboard-online.json").write_text(json.dumps(dashboard, indent=2), encoding="utf-8")
    RESULTS.append({"test": "Hardware state observed", "result": "OBSERVED",
                    "status": dashboard["hardware"]["status"], "lastSeenAt": dashboard["hardware"]["lastSeenAt"]})
    check("Three actual chart series, max 15", len(dashboard["chart"]) == 3 and
          all(len(points) == 15 for points in dashboard["chart"].values()))
    for path in ("/api/sensor-data?size=0", "/api/action-history?page=-1", "/api/action-history?size=21",
                 "/api/sensor-data?sortBy=unknown", "/api/action-history?status=unknown",
                 "/api/sensor-data?from=2026-10-28T00:00:00Z&to=2026-10-27T00:00:00Z"):
        code, _ = call(path, main_token)
        check("Invalid query " + path, code == 400)
    for username, token in tokens.items():
        for size in (5, 10, 15, 20):
            for endpoint in ("sensor-data", "action-history"):
                page = get(f"/api/{endpoint}?size={size}&page=0&sortBy=ID&order=DESC", token)
                ids = [row["id"] for row in page["content"]]
                check(f"Paging/sort {username} {endpoint} size={size}",
                      len(ids) <= size and page["size"] == size and ids == sorted(ids, reverse=True))
                if endpoint == "action-history":
                    check("History username schema " + username,
                          all(isinstance(row.get("username"), str) and row["username"]
                              and "password" not in json.dumps(row).lower() for row in page["content"]))
        for filters in ({"device": "LED1"}, {"action": "OFF"}, {"status": "PROCESSING"}):
            page = get("/api/action-history?" + urlencode({"size": 20, **filters}), token)
            check("History filter " + username + " " + str(filters), all(
                ("device" not in filters or row["deviceCode"] == filters["device"]) and
                ("action" not in filters or row["action"] == filters["action"]) and
                ("status" not in filters or row["deliveryState"] == "PENDING") for row in page["content"]))

    fields = ("fullName", "studentCode", "email", "githubUrl", "figmaUrl", "apiDocsUrl", "reportUrl", "avatarUrl")
    original = {key: profiles["user125"].get(key) for key in fields}
    token = tokens["user125"]
    try:
        changed = {**original, "fullName": original["fullName"] + " (review)"}
        code, _ = call("/api/profile", token, changed, "PUT")
        check("Profile PUT user125", code == 200)
        updated = get("/api/profile", token)
        check("Profile PUT persisted", updated["fullName"] == changed["fullName"])
        main_profile = get("/api/profile", main_token)
        check("Editing user125 does not change user123", main_profile == profiles["user123"])
        code, _ = call("/api/profile", token, {**changed, "email": profiles["user123"]["email"]}, "PUT")
        check("Duplicate profile email rejected", code == 409)
        code, _ = call("/api/profile", token, {**changed, "avatarUrl": "http://example.invalid/avatar.png"}, "PUT")
        check("HTTP avatar rejected", code == 400)
        code, _ = call("/api/profile", token, {**changed, "username": "user123"}, "PUT")
        check("Profile username spoof rejected", code == 400)
    finally:
        code, _ = call("/api/profile", token, original, "PUT")
        restored = get("/api/profile", token)
        check("Restore original user125 profile fields", code == 200 and
              all(restored.get(key) == value for key, value in original.items()))

    devices = {row["code"]: row["id"] for row in dashboard["devices"]}
    for body in ({"action": "ON", "username": "user123"}, {"action": "TOGGLE"}):
        code, _ = call(f"/api/devices/{devices['LED1']}/actions", main_token, body)
        check("Command invalid/spoofed body rejected", code == 400)
    code, _ = call("/api/devices/999999999/actions", main_token, {"action": "ON"})
    check("Unknown device rejected", code == 404)

    if "--read-only-led" in sys.argv:
        save()
        print(json.dumps({"tests": len(RESULTS), "failures": sum(r["result"] == "FAIL" for r in RESULTS),
                          "realCommands": 0, "profileFieldsRestored": True,
                          "ledTests": "DEFERRED until hardware confirmation"}))
        return
    current = get("/api/dashboard", main_token)
    check("Hardware ONLINE before real LED commands", current["hardware"]["status"] == "ONLINE")
    for username, device in (("user123", "LED1"), ("user124", "LED2"), ("user125", "LED1")):
        token = tokens[username]
        for action in ("ON", "OFF"):
            started = time.monotonic()
            code, response = call(f"/api/devices/{devices[device]}/actions", token, {"action": action})
            check("Command accepted " + username + " " + device + " " + action,
                  code == 202 and response.get("status") == "ACCEPTED", httpStatus=code)
            request_id = response["requestId"]
            command = {"username": username, "deviceCode": device, "action": action,
                       "requestId": request_id, "source": "Authenticated REST API, real ESP32 acknowledgment",
                       "httpStatus": code, "result": "PENDING"}
            COMMANDS.append(command)
            save()
            deadline = time.monotonic() + 15
            row = None
            while time.monotonic() < deadline:
                _, page = call(f"/api/action-history?searchField=ID&search={request_id}&size=1", token)
                if page.get("content"):
                    row = page["content"][0]
                    if row["deliveryState"] != "PENDING":
                        break
                time.sleep(0.2)
            command["history"] = row
            command["requestToRestConfirmationMs"] = round((time.monotonic() - started) * 1000, 2)
            command["result"] = "CONFIRMED" if row and row["deliveryState"] == "CONFIRMED" else "NOT_CONFIRMED"
            check("ESP32 confirmation and actor " + str(request_id), row and row["confirmedAt"]
                  and row["status"] == action and row["username"] == username)
            state = get("/api/dashboard", token)
            check("Device reflects ACK " + str(request_id),
                  next(d for d in state["devices"] if d["code"] == device)["status"] == action)
            save()
            print(json.dumps({"requestId": request_id, "user": username, "device": device,
                              "action": action, "result": command["result"]}), flush=True)
    save()
    print(json.dumps({"tests": len(RESULTS), "failures": sum(r["result"] == "FAIL" for r in RESULTS),
                      "realCommands": len(COMMANDS), "profileFieldsRestored": True}))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        save()
        print(json.dumps({"error": str(error) if isinstance(error, AssertionError) else type(error).__name__,
                          "testsCompleted": len(RESULTS)}))
        raise SystemExit(1)
