"""Export the running app's public API schema without examples or credentials."""
from datetime import datetime, timezone
import json
from pathlib import Path
from urllib.request import urlopen


def without_examples(value):
    if isinstance(value, dict):
        return {key: without_examples(item) for key, item in value.items()
                if key not in {"example", "examples"}}
    if isinstance(value, list):
        return [without_examples(item) for item in value]
    return value


def main():
    folder = Path(__file__).resolve().parents[1] / "data"
    folder.mkdir(parents=True, exist_ok=True)
    with urlopen("http://127.0.0.1:8088/v3/api-docs", timeout=20) as response:
        document = without_examples(json.load(response))
    assert "username" in document["components"]["schemas"]["HistoryRow"]["properties"]
    (folder / "openapi-no-examples.json").write_text(
        json.dumps(document, ensure_ascii=False, indent=2), encoding="utf-8")
    methods = {"get", "post", "put", "patch", "delete", "head", "options", "trace"}
    operations = [{"method": method.upper(), "path": path}
                  for path, definition in document["paths"].items()
                  for method in definition if method in methods]
    metadata = {"capturedAtUtc": datetime.now(timezone.utc).isoformat(),
                "source": "GET http://127.0.0.1:8088/v3/api-docs (no authentication)",
                "examplesRemoved": True, "historyUsernamePresent": True,
                "operations": operations}
    (folder / "openapi-export.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"operations": len(operations), "historyUsernamePresent": True,
                      "saved": str(folder / "openapi-no-examples.json")}))


if __name__ == "__main__":
    main()
