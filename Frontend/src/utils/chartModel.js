export const CHART_LIMIT = 15;
export const CHART_SERIES = [
  { code: "DHT11_TEMP", name: "Nhiệt độ", unit: "°C", color: "#dc2626" },
  { code: "DHT11_HUM", name: "Độ ẩm", unit: "%RH", color: "#2563eb" },
  { code: "LDR_LIGHT", name: "Ánh sáng", unit: "lux", color: "#b96a08" },
];
const clock = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit",
  second: "2-digit", hourCycle: "h23",
});
export const formatChartTime = time => clock.format(new Date(time));
export function buildChartModel(chart) {
  return CHART_SERIES.map(definition => {
    const points = (chart?.[definition.code] || [])
      .filter(point => point.value !== null && point.value !== undefined)
      .map(point => ({ recordedAt: point.recordedAt, time: Date.parse(point.recordedAt), value: Number(point.value) }))
      .filter(point => Number.isFinite(point.time) && Number.isFinite(point.value))
      .sort((first, second) => first.time - second.time)
      .slice(-CHART_LIMIT);
    return { ...definition, points };
  });
}

function niceStep(value) {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 5, 10].find(step => step * magnitude >= value) * magnitude;
}

export function chartScale(series) {
  const values = series.flatMap(item => item.points.map(point => point.value));
  const lowest = Math.min(0, ...values);
  const highest = Math.max(1, ...values);
  const step = niceStep((highest * 1.1 - lowest) / 4);
  const min = Math.floor(lowest / step) * step;
  const max = Math.ceil(highest * 1.1 / step) * step;
  const ticks = [];
  for (let value = min; value <= max + step / 100; value += step) ticks.push(value);
  return { min, max, ticks };
}

export const PLOT = { width: 1000, height: 260, left: 60, right: 34, top: 18, bottom: 30 };

export function plotChart(series, width = PLOT.width, visibleCodes = series.map(item => item.code)) {
  const scale = chartScale(series.filter(item => visibleCodes.includes(item.code)));
  const innerWidth = width - PLOT.left - PLOT.right;
  const height = PLOT.height - PLOT.top - PLOT.bottom;
  const x = index => PLOT.left + index / (CHART_LIMIT - 1) * innerWidth;
  const y = value => PLOT.top + (scale.max - value) / (scale.max - scale.min) * height;
  const plottedSeries = series.map(item => ({ ...item, points: item.points.map((point, index) => {
    const slot = CHART_LIMIT - item.points.length + index;
    return { ...point, slot, x: x(slot), y: y(point.value) };
  }) }));
  // Mốc giờ nhất quán: ưu tiên nhiệt độ, chỉ dùng sensor khác khi chưa có nhiệt độ.
  // Nhãn lấy từ reading thật, không suy ra giờ hoặc coi ba sensor là cùng chu kỳ đo.
  const reference = plottedSeries.find(item => item.code === "DHT11_TEMP" && item.points.length)
    ?? plottedSeries.find(item => item.points.length);
  const recordSlots = Array.from({ length: CHART_LIMIT }, (_, slot) => {
    const point = reference?.points.find(point => point.slot === slot);
    return { slot, x: x(slot), time: point?.time ?? null, label: point ? formatChartTime(point.time) : "" };
  });
  const candidates = recordSlots.filter(tick => tick.time !== null);
  const minLabelGap = 78;
  const recordTicks = candidates.filter((tick, index) => {
    if (index === 0 || index === candidates.length - 1) return true;
    const step = Math.max(1, Math.ceil(minLabelGap / (innerWidth / (CHART_LIMIT - 1))));
    return index % step === 0 && candidates.at(-1).x - tick.x >= minLabelGap;
  });
  return {
    scale, width, referenceName: reference?.name ?? null, recordSlots, recordTicks,
    // Vị trí thể hiện thứ tự trong 15 bản ghi của từng sensor, không phải chu kỳ đo chung.
    // Khi chưa đủ 15 reading, để trống bên trái và giữ reading mới nhất ở vị trí 15.
    series: plottedSeries,
    ticks: scale.ticks.map(value => ({ value, y: y(value) })),
  };
}

export function readingAtSlot(points, slot) {
  return points.find(point => point.slot === slot) ?? null;
}
