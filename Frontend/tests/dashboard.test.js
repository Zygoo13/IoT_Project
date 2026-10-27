import assert from "node:assert/strict";
import test from "node:test";
import { capNhatDashboardRealtime } from "../src/utils/dashboard.js";

function snapshot() {
  return {
    latest: {}, chart: { DHT11_TEMP: [], DHT11_HUM: [], LDR_LIGHT: [] },
    hardware: { status: "OFFLINE", lastSeenAt: null }, devices: [{ code: "LED1", status: "OFF" }],
  };
}
const reading = (second, value = second) => ({
  sensorCode: "LDR_LIGHT", value,
  recordedAt: new Date(Date.UTC(2026, 9, 20, 18, 0, second)).toISOString(),
});

test("Giữ 15 reading mới nhất, cập nhật card và lastSeenAt mà không sửa snapshot", () => {
  const original = snapshot();
  let dashboard = original;
  for (let second = 0; second < 20; second++) dashboard = capNhatDashboardRealtime(dashboard, "sensors", reading(second));
  assert.equal(dashboard.chart.LDR_LIGHT.length, 15);
  assert.equal(dashboard.chart.LDR_LIGHT[0].value, 5);
  assert.equal(dashboard.latest.LDR_LIGHT.value, 19);
  assert.equal(dashboard.hardware.lastSeenAt, reading(19).recordedAt);
  assert.equal(original.chart.LDR_LIGHT.length, 0);
});

test("Event đến đảo thứ tự vẫn đủ lịch sử; card không lùi, event lặp không render lại", () => {
  let dashboard = capNhatDashboardRealtime(snapshot(), "sensors", reading(2));
  dashboard = capNhatDashboardRealtime(dashboard, "sensors", reading(1));
  assert.deepEqual(dashboard.chart.LDR_LIGHT.map(point => point.value), [1, 2]);
  assert.equal(dashboard.latest.LDR_LIGHT.value, 2);
  assert.equal(dashboard.hardware.lastSeenAt, reading(2).recordedAt);
  assert.equal(capNhatDashboardRealtime(dashboard, "sensors", reading(1)), dashboard);
});

test("Offline không đổi đèn; phản hồi chỉ cập nhật đúng thiết bị", () => {
  const original = snapshot();
  const changed = capNhatDashboardRealtime(original, "devices", { deviceCode: "LED1", status: "ON" });
  assert.equal(capNhatDashboardRealtime(changed, "hardware", { status: "OFFLINE", lastSeenAt: null }).devices[0].status, "ON");
  assert.equal(original.devices[0].status, "OFF");
});
