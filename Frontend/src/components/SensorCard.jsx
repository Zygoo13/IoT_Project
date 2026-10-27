import { formatValue } from "../utils/formatValue";

export default function SensorCard({ title, type, value, unit }) {
  const coGiaTri = value !== undefined && value !== null;

  return (
    <article className="sensor-card">
      <svg className={`sensor-icon ${type}`} viewBox="0 0 32 32" aria-hidden="true">
        {type === "temperature" && (
          <>
            <path d="M12 19V7a4 4 0 0 1 8 0v12a7 7 0 1 1-8 0Z" />
            <path d="M16 12v11" /><circle cx="16" cy="25" r="2" />
          </>
        )}
        {type === "humidity" && (
          <>
            <path d="M16 3S6 14 6 21a10 10 0 0 0 20 0C26 14 16 3 16 3Z" />
            <path d="M11 22a5 5 0 0 0 5 5" />
          </>
        )}
        {type === "light" && (
          <>
            <circle cx="16" cy="16" r="6" />
            <path d="M16 2v4m0 20v4M2 16h4m20 0h4M6 6l3 3m14 14 3 3M6 26l3-3M23 9l3-3" />
          </>
        )}
      </svg>
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
