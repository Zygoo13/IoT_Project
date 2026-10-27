import assert from "node:assert/strict";
import test from "node:test";
import { parseSearchTimeRange } from "../src/utils/dateTime.js";

test("Ngày Việt Nam được đổi thành khoảng UTC, bao gồm toàn bộ micro giây cuối ngày", () => {
  assert.deepEqual(parseSearchTimeRange("21/10/2026"), {
    from: "2026-10-20T17:00:00.000Z", to: "2026-10-21T16:59:59.999999Z",
  });
});

test("Tìm đúng một giây và xử lý chuyển ngày", () => {
  assert.deepEqual(parseSearchTimeRange("21/10/2026 00:00:00"), {
    from: "2026-10-20T17:00:00.000Z", to: "2026-10-20T17:00:00.999999Z",
  });
});

test("Bỏ lọc với chuỗi trống, từ chối ngày không hợp lệ", () => {
  assert.equal(parseSearchTimeRange("   "), null);
  assert.throws(() => parseSearchTimeRange("31/02/2026"));
  assert.throws(() => parseSearchTimeRange("21/10/2026 25:00:00"));
});
