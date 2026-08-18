function SensorCard({ title, value, unit }) {
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
    </article>
  );
}

export default SensorCard;
