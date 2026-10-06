const STATUS_LABELS = {
  ON: "Đang bật",
  OFF: "Đang tắt",
};

export default function DeviceControl({
  device,
  commandState,
  hardwareOffline,
  onControl,
}) {
  const isUnknown = device.status === "UNKNOWN";
  const isPending = commandState?.pending;

  const statusLabel =
    STATUS_LABELS[device.status] || "Chưa xác định";

  const statusClass =
    device.status === "ON"
      ? "is-on"
      : device.status === "OFF"
        ? "is-off"
        : "is-unknown";

  const commandMessage = isUnknown
    ? "Chưa tải được trạng thái thiết bị."
    : commandState?.message;

  const deviceName =
    device.code === "LED1"
      ? "LED 1"
      : "LED 2";

  const bulbClass =
    device.status === "ON"
      ? "is-on"
      : "is-off";

  return (
    <article className="device-card">
      <div className="device-card-content">
        <h3>{deviceName}</h3>

        <p className="device-status">
          Trạng thái:{" "}
          <span
            className={`device-status-badge ${statusClass}`}
          >
            {statusLabel}
          </span>
        </p>

        {(isUnknown || commandState) && (
          <p
            className={`command-message ${commandState?.type || ""}`}
            aria-live="polite"
          >
            {commandMessage}
          </p>
        )}

        {hardwareOffline && !isUnknown && (
          <p className="device-offline-note">
            Mất kết nối phần cứng.
          </p>
        )}

        <div className="device-actions">
          <button
            className="on-button"
            type="button"
            disabled={isPending || isUnknown}
            onClick={() => onControl(device.code, "ON")}
          >
            ON
          </button>

          <button
            className="off-button"
            type="button"
            disabled={isPending || isUnknown}
            onClick={() => onControl(device.code, "OFF")}
          >
            OFF
          </button>
        </div>
      </div>

      <svg
        className={`device-bulb ${bulbClass}`}
        viewBox="0 0 64 80"
        role="img"
        aria-label={`${device.code}: ${statusLabel}`}
      >
        <path
          className="bulb-glow"
          d="M32 7a23 23 0 0 0-14 41c3 2 5 6 5 10h18c0-4 2-8 5-10A23 23 0 0 0 32 7Z"
        />

        <path
          className="bulb-outline"
          d="M32 7a23 23 0 0 0-14 41c3 2 5 6 5 10h18c0-4 2-8 5-10A23 23 0 0 0 32 7Z"
        />

        <path
          className="bulb-base"
          d="M23 59h18m-17 6h16m-13 6h10"
        />
      </svg>
    </article>
  );
}