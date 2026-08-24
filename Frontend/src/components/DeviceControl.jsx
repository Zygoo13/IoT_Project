function DeviceControl({ device, commandState, hardwareOffline, onControl }) {
  const isUnknown = device.status === "UNKNOWN";
  const isPending = commandState?.pending;
  const badgeClass = device.status === "ON"
    ? "device-status-badge is-on"
    : device.status === "OFF"
      ? "device-status-badge is-off"
      : "device-status-badge is-unknown";

  return (
    <article className="device-card">
      <h3>{device.name}</h3>
      <p className="device-status">
        Confirmed status: <span className={badgeClass}>{device.status}</span>
      </p>

      <p className={`command-message ${commandState?.type || ""}`} aria-live="polite">
        {isUnknown ? "Unable to load status" : commandState?.message || "Ready"}
      </p>

      {hardwareOffline && !isUnknown && (
        <p className="device-offline-note">Hardware is offline. This is the last confirmed status.</p>
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
    </article>
  );
}

export default DeviceControl;
