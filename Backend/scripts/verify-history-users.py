"""Read-only live regression checks; no LED commands or database writes.

Run from the repository root:
  python Backend/scripts/verify-history-users.py before
  # Deploy the new app.
  python Backend/scripts/verify-history-users.py after

Reads local environment in memory, never prints passwords, hashes or JWTs.
Stores only digests, counts and non-sensitive test results in ignored tmp/.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "tmp/runtime-review/history-users"
BASE = "http://127.0.0.1:8088"


def sql(statement):
    process = subprocess.run(
        ["docker", "exec", "-i", "iot_backend_mysql_20261005", "sh", "-c",
         'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql --user="$MYSQL_USER" '
         '"$MYSQL_DATABASE" --default-character-set=utf8mb4 -N -B'],
        input=statement, capture_output=True, text=True, encoding="utf-8", timeout=20)
    if process.returncode:
        raise RuntimeError("Read-only MySQL check failed; details suppressed to protect credentials")
    return process.stdout.rstrip("\r\n")


def digest(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def request(path, token=None, body=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    payload = None if body is None else json.dumps(body).encode()
    with urlopen(Request(BASE + path, data=payload, headers=headers), timeout=20) as response:
        return json.load(response)


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    phase = sys.argv[1]
    check(phase in ("before", "after"), "Use before or after")
    OUT.mkdir(parents=True, exist_ok=True)
    baseline_file = OUT / "baseline.json"
    if phase == "before":
        primary = sql("SELECT * FROM `User` WHERE username='user123';")
        check(bool(primary), "Primary account user123 was not found")
        history = sql("SELECT id,userId,deviceId,action,createdAt FROM ActionHistory ORDER BY id;")
        max_id = int(sql("SELECT COALESCE(MAX(id),0) FROM ActionHistory;"))
        baseline = {
            "primary_digest": digest(primary),
            "history_digest": digest(history),
            "history_count": int(sql("SELECT COUNT(*) FROM ActionHistory;")),
            "max_history_id": max_id,
            "sensor_count": int(sql("SELECT COUNT(*) FROM SensorData;")),
            "user_count": int(sql("SELECT COUNT(*) FROM `User`;")),
        }
        baseline_file.write_text(json.dumps(baseline, indent=2), encoding="utf-8")
        print(json.dumps({"baseline_saved": True, "users_before": baseline["user_count"],
                          "history_before": baseline["history_count"]}))
        return

    baseline = json.loads(baseline_file.read_text(encoding="utf-8"))
    check(digest(sql("SELECT * FROM `User` WHERE username='user123';")) == baseline["primary_digest"],
          "Primary account fields or password changed")
    previous_history = sql("SELECT id,userId,deviceId,action,createdAt FROM ActionHistory "
                           f"WHERE id <= {int(baseline['max_history_id'])} ORDER BY id;")
    check(digest(previous_history) == baseline["history_digest"], "Existing history ownership changed")
    check(int(sql("SELECT COUNT(*) FROM SensorData;")) >= baseline["sensor_count"], "Sensor data decreased")
    check(int(sql("SELECT COUNT(*) FROM `User`;")) == 3, "Expected exactly three live accounts")
    check(sql("SELECT GROUP_CONCAT(username ORDER BY username) FROM `User`;") == "user123,user124,user125",
          "Unexpected account names")

    env = {}
    for line in (ROOT / "Backend/.env").read_text(encoding="utf-8-sig").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            env[key] = value
    actors = {int(row.split("\t")[0]): row.split("\t")[1]
              for row in sql("SELECT h.id,u.username FROM ActionHistory h "
                             "JOIN `User` u ON u.id=h.userId ORDER BY h.id;").splitlines() if row}
    results = []
    for username in ("user123", "user124", "user125"):
        token = request("/api/auth/login", body={"username": username,
                        "password": env["IOT_SEED_PASSWORD"]})["token"]
        profile = request("/api/profile", token)
        check(profile["username"] == username, "Profile is not scoped to the signed-in account")
        for page in (0, 1):
            data = request("/api/action-history?" + urlencode({"size": 5, "page": page,
                           "sortBy": "ID", "order": "DESC"}), token)
            check(data["page"] == page and data["size"] == 5, "Pagination contract changed")
            for row in data["content"]:
                check(row["username"] == actors[row["id"]], "History actor does not match MySQL userId")
                check("password" not in json.dumps(row).lower(), "History leaks password fields")
        for filters in ({"device": "LED1"}, {"action": "ON"}, {"status": "OFF"},
                        {"status": "PROCESSING"}, {"device": "LED2", "action": "OFF"}):
            data = request("/api/action-history?" + urlencode({"size": 20, **filters}), token)
            for row in data["content"]:
                check(row["username"] == actors[row["id"]], "Filtered history actor mismatch")
                if "device" in filters:
                    check(row["deviceCode"] == filters["device"], "Device filter changed")
                if "action" in filters:
                    check(row["action"] == filters["action"], "Action filter changed")
                if filters.get("status") == "PROCESSING":
                    check(row["deliveryState"] == "PENDING", "Processing filter changed")
                elif "status" in filters:
                    check(row["status"] == filters["status"], "Status filter changed")
        request("/api/dashboard", token)
        request("/api/sensor-data?size=5", token)
        results.append({"username": username, "login": "PASS", "profile_isolation": "PASS",
                        "history_sql_attribution_paging_filters": "PASS", "read_api_smoke": "PASS"})

    schema = request("/v3/api-docs")["components"]["schemas"]["HistoryRow"]["properties"]
    check("username" in schema, "Swagger has no HistoryRow.username")
    try:
        request("/api/action-history")
        raise AssertionError("History accepts unauthenticated requests")
    except HTTPError as error:
        check(error.code == 401, "Expected 401 without token")
    report = {"accounts": results, "primary_unchanged": True, "old_history_unchanged": True,
              "sensor_data_preserved": True, "swagger_username": True, "unauthenticated_401": True,
              "live_commands_sent": 0, "live_database_writes_by_test": 0}
    (OUT / "verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Avoid printing HTTP bodies, subprocess output, secrets or tokens on failures.
        print(type(error).__name__ + ": " + (str(error) if isinstance(error, AssertionError)
                                             else "Verification failed; details suppressed"))
        sys.exit(1)
