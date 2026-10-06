import { formatValue } from "../utils/formatValue";

export default function SensorCard({ title, value, unit }) {
  const coGiaTri = value !== undefined && value !== null;

  return (
    <article className="sensor-card">
      <p>{title}</p>

      <strong className="sensor-value">
        {coGiaTri ? (
          <>
            {formatValue(value)} <span>{unit}</span>
          </>
        ) : (
          "N/A"
        )}
      </strong>
    </article>
  );
}