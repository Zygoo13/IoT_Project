function DeviceControl({ device, commandState, hardwareOffline, onControl }) {
  const isUnknown = device.status === "UNKNOWN";
  const isPending = commandState?.pending;
  const badgeClass = device.status === "ON"
    ? "device-status-badge is-on"
    : device.status === "OFF"
      ? "device-status-badge is-off"
      : "device-status-badge is-unknown";
  const statusLabel = device.status === "ON"
    ? "Đang bật"
    : device.status === "OFF"
      ? "Đang tắt"
      : "Chưa xác định";

  return (
    <article className="device-card">
      <h3>{device.name}</h3>
      <p className="device-status">
        Trạng thái: <span className={badgeClass}>{statusLabel}</span>
      </p>

      {(isUnknown || commandState) && (
        <p className={`command-message ${commandState?.type || ""}`} aria-live="polite">
          {isUnknown ? "Chưa tải được trạng thái thiết bị." : commandState.message}
        </p>
      )}

      {hardwareOffline && !isUnknown && (
        <p className="device-offline-note">Mất kết nối phần cứng. Đây là trạng thái được xác nhận gần nhất.</p>
      )}

      <div className="device-actions">
        <button
          className="on-button"
          type="button"
          disabled={isPending || isUnknown}
          onClick={() => onControl(device.code, "ON")}
        >
          Bật
        </button>
        <button
          className="off-button"
          type="button"
          disabled={isPending || isUnknown}
          onClick={() => onControl(device.code, "OFF")}
        >
          Tắt
        </button>
      </div>
    </article>
  );
}

export default DeviceControl;
