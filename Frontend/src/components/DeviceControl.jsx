function DeviceControl({ device, waitingConfirmation, onControl }) {
  return (
    <article className="device-card">
      <h3>{device.name}</h3>
      <p className="device-status">
        Status: <strong>{device.status}</strong>
      </p>

      {waitingConfirmation && <p className="waiting-message">Waiting for confirmation...</p>}

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
