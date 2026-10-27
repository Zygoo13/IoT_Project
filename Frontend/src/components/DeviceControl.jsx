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
  const khongXacDinh = device.status === "UNKNOWN";
  const dangCho = commandState?.pending;
  const dangBat = dangCho && commandState.action === "ON";
  const dangTat = dangCho && commandState.action === "OFF";

  const nhanTrangThai = STATUS_LABELS[device.status] || "Chưa xác định";

  const classTrangThai =
    device.status === "ON"
      ? "is-on"
      : device.status === "OFF"
        ? "is-off"
        : "is-unknown";

  const thongBaoLenh = khongXacDinh
    ? "Chưa tải được trạng thái thiết bị."
    : commandState?.message;

  const tenThietBi = device.code === "LED1" ? "LED 1" : "LED 2";
  const classBongDen = device.status === "ON" ? "is-on" : "is-off";

  return (
    <article className="device-card">
      <div className="device-card-content">
        <h3>{tenThietBi}</h3>

        <p className="device-status">
          Trạng thái:{" "}
          <span className={`device-status-badge ${classTrangThai}`}>
            {nhanTrangThai}
          </span>
        </p>

        {(khongXacDinh || commandState?.pending || commandState?.type === "error") && (
          <p
            className={`command-message ${commandState?.type || ""} ${commandState?.action === "ON" ? "is-on" : commandState?.action === "OFF" ? "is-off" : ""}`}
            aria-live="polite"
          >
            {thongBaoLenh}
          </p>
        )}

        {hardwareOffline && !khongXacDinh && (
          <p className="device-offline-note">Mất kết nối phần cứng.</p>
        )}

        <div className="device-actions">
          <button
            className={`on-button${device.status === "OFF" ? " is-current" : ""}${dangBat ? " is-requested" : ""}`}
            aria-busy={Boolean(dangBat)}
            type="button"
            disabled={dangCho || khongXacDinh}
            onClick={() => onControl(device.code, "ON")}
          >
            {dangBat && <span className="command-spinner" aria-hidden="true" />}
            {dangBat ? "Đang bật…" : "Bật đèn"}
          </button>

          <button
            className={`off-button${device.status === "ON" ? " is-current" : ""}${dangTat ? " is-requested" : ""}`}
            aria-busy={Boolean(dangTat)}
            type="button"
            disabled={dangCho || khongXacDinh}
            onClick={() => onControl(device.code, "OFF")}
          >
            {dangTat && <span className="command-spinner" aria-hidden="true" />}
            {dangTat ? "Đang tắt…" : "Tắt đèn"}
          </button>
        </div>
      </div>

      <svg
        className={`device-bulb ${classBongDen}`}
        viewBox="0 0 64 80"
        role="img"
        aria-label={`${device.code}: ${nhanTrangThai}`}
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
