function SensorCard({ title, value, unit }) {
  const displayValue = value === undefined || value === null ? "N/A" : `${value} ${unit}`;

  return (
    <article className="sensor-card">
      <p>{title}</p>
      <strong>{displayValue}</strong>
    </article>
  );
}

export default SensorCard;
