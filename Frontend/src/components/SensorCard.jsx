function SensorCard({ title, value, unit, stale }) {
  const hasValue = value !== undefined && value !== null;

  return (
    <article className="sensor-card">
      <p>{title}</p>
      <strong className="sensor-value">
        {hasValue ? (
          <>
            {value} <span>{unit}</span>
          </>
        ) : (
          "N/A"
        )}
      </strong>
      {stale && <span className="stale-label">Dữ liệu cũ</span>}
    </article>
  );
}

export default SensorCard;
