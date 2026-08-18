function DeviceControl({ device, waitingConfirmation, onControl }) {
  return (
    <article className="device-card">
      <h3>{device.name}</h3>
      <p className="device-status">
        Status: <span className={device.status === "ON" ? "device-status-badge is-on" : "device-status-badge is-off"}>{device.status}</span>
      </p>

      <p className="waiting-message" aria-live="polite">
        {waitingConfirmation ? "Waiting for confirmation..." : "\u00a0"}
      </p>

      <div className="device-actions">
        <button
          className="on-button"
          type="button"
          disabled={waitingConfirmation}
          onClick={() => onControl(device.code, "ON")}
        >
          ON
        </button>
        <button
          className="off-button"
          type="button"
          disabled={waitingConfirmation}
          onClick={() => onControl(device.code, "OFF")}
        >
          OFF
        </button>
      </div>
    </article>
  );
}

export default DeviceControl;
