export function formatValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) : "N/A";
}
