export function formatValue(value) {
  const so = Number(value);

  return Number.isFinite(so) ? so.toFixed(1) : "N/A";
}