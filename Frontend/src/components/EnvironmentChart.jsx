import { memo, useEffect, useMemo, useRef, useState } from "react";
import { formatDateTime } from "../utils/dateTime";
import { formatValue } from "../utils/formatValue";
import { buildChartModel, CHART_LIMIT, CHART_SERIES, PLOT, plotChart, readingAtSlot } from "../utils/chartModel";

const EMPTY_CHART = {};

function EnvironmentChart({ chart = EMPTY_CHART, loading }) {
  const [visibleCodes, setVisibleCodes] = useState(() => CHART_SERIES.map(series => series.code));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [width, setWidth] = useState(PLOT.width);
  const containerRef = useRef(null);
  const model = useMemo(() => buildChartModel(chart), [chart]);
  const plot = useMemo(() => plotChart(model, width, visibleCodes), [model, width, visibleCodes]);
  const hasData = model.some(series => series.points.length);
  const selection = selectedSlot;
  const selectionX = selection === null ? null : PLOT.left + selection / (CHART_LIMIT - 1) * (width - PLOT.left - PLOT.right);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const nextWidth = Math.round(entries[0].contentRect.width);
      if (nextWidth > 100) setWidth(nextWidth);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [loading, hasData]);

  function movePointer(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(PLOT.left, Math.min(width - PLOT.right, (event.clientX - bounds.left) / bounds.width * width));
    setSelectedSlot(Math.round((x - PLOT.left) / (width - PLOT.left - PLOT.right) * (CHART_LIMIT - 1)));
  }

  function moveKeyboard(event) {
    if (event.key === "Escape") { setSelectedSlot(null); return; }
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let slot = selection ?? CHART_LIMIT - 1;
    if (event.key === "Home") slot = 0;
    else if (event.key === "End") slot = CHART_LIMIT - 1;
    else slot += event.key === "ArrowLeft" ? -1 : 1;
    setSelectedSlot(Math.max(0, Math.min(CHART_LIMIT - 1, slot)));
  }

  function toggleSeries(code) {
    setVisibleCodes(current => current.includes(code)
      ? current.length > 1 ? current.filter(item => item !== code) : current
      : [...current, code]);
  }

  return (
    <section className="chart-section environment-history">
      <div className="section-heading"><h2>Biểu đồ môi trường</h2></div>
      {loading ? <p>Đang tải...</p> : !hasData ? <p>Chưa có dữ liệu</p> : <>
        <div className="environment-chart-body" ref={containerRef}>
          <svg className="environment-chart-svg" viewBox={`0 0 ${width} ${PLOT.height}`}
            role="img" aria-label={`Biểu đồ môi trường: 15 bản ghi gần nhất mỗi cảm biến. Mốc giờ theo ${plot.referenceName || "cảm biến"}. Dùng phím trái, phải để xem số đo.`}
            tabIndex={0} onPointerMove={movePointer} onPointerLeave={() => setSelectedSlot(null)}
            onKeyDown={moveKeyboard} onBlur={() => setSelectedSlot(null)}>
            <text className="trend-time" transform={`translate(12 ${(PLOT.height - PLOT.bottom + PLOT.top) / 2}) rotate(-90)`} textAnchor="middle">°C / %RH / lux</text>
            {plot.ticks.map(tick => <g key={tick.value} className="trend-grid">
              <line x1={PLOT.left} x2={width - PLOT.right} y1={tick.y} y2={tick.y} />
              <text x={PLOT.left - 8} y={tick.y} textAnchor="end" dominantBaseline="middle">{tick.value}</text>
            </g>)}
            <path className="trend-axis" d={`M${PLOT.left},${PLOT.top} V${PLOT.height - PLOT.bottom} H${width - PLOT.right}`} />
            {plot.recordTicks.map(tick => <g key={tick.slot}>
              <line className="trend-axis" x1={tick.x} x2={tick.x} y1={PLOT.height - PLOT.bottom} y2={PLOT.height - PLOT.bottom + 4} />
              <text className="trend-time" x={tick.x} y={PLOT.height - PLOT.bottom + 19} textAnchor="middle">{tick.label}</text>
            </g>)}
            {plot.series.map(series => <g key={series.code} data-sensor={series.code}
              style={{ "--series-color": series.color, display: visibleCodes.includes(series.code) ? undefined : "none" }}>
              <path className="trend-line" d={series.points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ")} />
              {series.points.map((point, index) => <circle className="trend-point" key={`${point.recordedAt}-${index}`}
                cx={point.x} cy={point.y} r={index === series.points.length - 1 ? 3 : 1.8}
                data-recorded-at={point.recordedAt} data-value={point.value} data-slot={point.slot} />)}
            </g>)}
            {selection !== null && <g className="trend-selection">
              <line x1={selectionX} x2={selectionX} y1={PLOT.top} y2={PLOT.height - PLOT.bottom} />
              {plot.series.filter(series => visibleCodes.includes(series.code)).map(series => {
                const point = readingAtSlot(series.points, selection);
                return point ? <circle key={series.code} cx={point.x} cy={point.y} r="4" style={{ fill: series.color }} /> : null;
              })}
            </g>}
          </svg>
          {selection !== null && <div className="environment-chart-tooltip" role="tooltip"
            style={{ left: Math.max(4, Math.min(selectionX + 12, width - 248)) }}>
            <strong>{plot.recordSlots[selection]?.time !== null ? formatDateTime(plot.recordSlots[selection].time) : `Bản ghi #${selection + 1}`}</strong>
            <span className="chart-reference">Mốc {plot.referenceName}</span>
            {plot.series.filter(series => visibleCodes.includes(series.code)).map(series => {
              const point = readingAtSlot(series.points, selection);
              return <div key={series.code}>
                <span style={{ color: series.color }}>{series.name}</span>
                <b>{point ? `${formatValue(point.value)} ${series.unit}` : "—"}</b>
                <small>{point ? formatDateTime(point.recordedAt) : "Chưa có bản ghi ở vị trí này"}</small>
              </div>;
            })}
          </div>}
        </div>
        <div className="environment-chart-legend" aria-label="Chú giải biểu đồ">
          {model.map(series => <button key={series.code} type="button" aria-pressed={visibleCodes.includes(series.code)}
            className="trend-legend-button" style={{ "--series-color": series.color }}
            onClick={() => toggleSeries(series.code)} title="Bấm để ẩn hoặc hiện đường cảm biến">
            <i />{series.name} <small>({series.unit})</small>
          </button>)}
        </div>
      </>}
    </section>
  );
}

export default memo(EnvironmentChart);
