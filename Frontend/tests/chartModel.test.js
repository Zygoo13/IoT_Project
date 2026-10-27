import assert from "node:assert/strict";
import test from "node:test";
import { buildChartModel, formatChartTime, PLOT, plotChart, readingAtSlot } from "../src/utils/chartModel.js";

const base = Date.UTC(2026, 9, 20, 18);
const point = (offset, value) => ({ recordedAt: new Date(base + offset).toISOString(), value });

test("Ba cảm biến lệch timestamp vẫn thẳng hàng hai đầu và 15 vị trí; giữ nguyên thời gian", () => {
  const data = Object.fromEntries(["DHT11_TEMP", "DHT11_HUM", "LDR_LIGHT"].map((code, sensor) => [code,
    Array.from({length:20}, (_, index) => point(index * 8000 + sensor * 900, index))]));
  const plot = plotChart(buildChartModel(data));
  for (const series of plot.series) {
    assert.equal(series.points.length, 15);
    assert.equal(series.points[0].value, 5);
    assert.equal(series.points.at(-1).value, 19);
    assert.equal(series.points[0].x, PLOT.left);
    assert.equal(series.points.at(-1).x, PLOT.width - PLOT.right);
    assert.deepEqual(series.points.map(point => point.x), plot.recordSlots.map(tick => tick.x));
  }
  assert.equal(plot.series[1].points[0].time - plot.series[0].points[0].time, 900);
  assert.equal(readingAtSlot(plot.series[2].points, 14).recordedAt, data.LDR_LIGHT.at(-1).recordedAt);
});

test("Vị trí là thứ tự bản ghi, không ép chu kỳ; giữ nguyên zero/spike và bản ghi đồng mili giây", () => {
  const model = buildChartModel({ LDR_LIGHT: [point(306,15.42), point(489,67.888), point(540,0), point(540,3), point(550,null), {recordedAt:"bad",value:4}] });
  const points = plotChart(model).series[2].points;
  assert.deepEqual(points.map(point => point.value), [15.42,67.888,0,3]);
  assert.equal(points[2].time - points[0].time, 234);
  assert.equal(readingAtSlot(points, 10), null);
});

test("Chưa đủ 15 reading thì để trống bên trái, không bịa hoặc kéo dài đường", () => {
  const plot = plotChart(buildChartModel({ DHT11_TEMP: [point(0,30)] }));
  assert.equal(plot.series[0].points.length, 1);
  assert.equal(plot.series[0].points[0].slot, 14);
  assert.equal(plot.series[0].points[0].x, PLOT.width - PLOT.right);
  assert.equal(readingAtSlot(plot.series[0].points, 0), null);
  for (const series of plotChart(buildChartModel({})).series) assert.equal(series.points.length, 0);
});

test("Ẩn đường chỉ đổi thang Y, vị trí bản ghi và dữ liệu giữ nguyên", () => {
  const model = buildChartModel({ DHT11_TEMP: [point(0,-10),point(1000,30)], LDR_LIGHT: [point(5000,300)] });
  const all = plotChart(model);
  const temperature = plotChart(model, 1000, ["DHT11_TEMP"]);
  assert.deepEqual(all.recordTicks, temperature.recordTicks);
  assert.deepEqual(all.series[0].points.map(point=>point.x), temperature.series[0].points.map(point=>point.x));
  assert.ok(all.scale.max >= 300 && all.scale.min <= -10);
  assert.ok(temperature.scale.max < all.scale.max);
  assert.equal(temperature.series[2].points[0].value, 300);
});

test("Nhãn trục luôn khớp vị trí điểm, hình không tự trượt và tọa độ hợp lệ khi resize", () => {
  const model = buildChartModel({ LDR_LIGHT: Array.from({length:15},(_,index)=>point(index*2000,index*3)) });
  assert.deepEqual(plotChart(model), plotChart(model));
  for (const width of [320,1000]) {
    const plot = plotChart(model,width);
    assert.equal(plot.recordTicks[0].label,formatChartTime(base));
    assert.equal(plot.recordTicks.at(-1).label,formatChartTime(base+28000));
    for (const tick of plot.recordTicks) assert.equal(tick.x,plot.series[2].points[tick.slot].x);
    for (const point of plot.series[2].points) {
      assert.ok(point.x >= PLOT.left && point.x <= width-PLOT.right);
      assert.ok(point.y >= PLOT.top && point.y <= PLOT.height-PLOT.bottom);
    }
  }
});

test("15 mốc giờ lấy từ bản ghi nhiệt độ, cập nhật theo mẫu mới và không đổi khi ẩn đường", () => {
  const chart = { DHT11_TEMP: Array.from({length:15},(_,index)=>point(index*2000,index)),
    DHT11_HUM: Array.from({length:15},(_,index)=>point(index*2000+900,index)) };
  const first = plotChart(buildChartModel(chart));
  assert.equal(first.referenceName,"Nhiệt độ");
  assert.equal(first.recordSlots.length,15);
  assert.deepEqual(first.recordTicks,plotChart(buildChartModel(chart),1000,["DHT11_HUM"]).recordTicks);
  chart.DHT11_TEMP.push(point(30000,15));
  const next = plotChart(buildChartModel(chart));
  assert.equal(next.recordSlots[0].time,base+2000);
  assert.equal(next.recordSlots[14].time,base+30000);
  assert.deepEqual(first.recordSlots.map(tick=>tick.x),next.recordSlots.map(tick=>tick.x));
  const wide = plotChart(buildChartModel(chart),2000);
  assert.equal(wide.recordTicks.length,15);
});
