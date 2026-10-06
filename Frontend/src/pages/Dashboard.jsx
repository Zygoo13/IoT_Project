import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DeviceControl from "../components/DeviceControl";
import SensorCard from "../components/SensorCard";
import { api, query } from "../services/api";
import { onRealtime } from "../services/realtime";
import { formatDateTime } from "../utils/dateTime";

const sensors = [
  { code: "DHT11_TEMP", title: "Nhiệt độ DHT11", field: "temperature", unit: "°C" },
  { code: "DHT11_HUM", title: "Độ ẩm DHT11", field: "humidity", unit: "%RH" },
  { code: "LDR_LIGHT", title: "Ánh sáng LDR LM393", field: "light", unit: "lux" },
];

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [realtime, setRealtime] = useState("CONNECTING");
  const [commandStates, setCommandStates] = useState({});
  const commandStatesRef = useRef(commandStates);
  const timers = useRef(new Set());

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api("/dashboard");
      setDashboard(data);
      setError("");
    } catch (problem) {
      setError(problem.status ? "Không tải được Dashboard." : "Không thể kết nối Backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);
  useEffect(() => { commandStatesRef.current = commandStates; }, [commandStates]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  async function reconcileRequest(deviceCode, requestId) {
    try {
      const page = await api(`/action-history?${query({ searchField: "ID", search: requestId, page: 0, size: 1 })}`);
      const row = page.content.find((item) => item.id === requestId);
      if (!row) return;
      if (row.deliveryState === "CONFIRMED") {
        setCommandStates((current) => current[deviceCode]?.requestId === requestId
          ? { ...current, [deviceCode]: { requestId, pending: false, type: "success", message: "Thiết bị đã phản hồi." } } : current);
        void loadDashboard();
      } else if (row.deliveryState === "TIMEOUT") {
        setCommandStates((current) => current[deviceCode]?.requestId === requestId
          ? { ...current, [deviceCode]: { requestId, pending: false, type: "error", message: "Thiết bị không phản hồi. Giữ trạng thái đã xác nhận." } } : current);
      }
    } catch { /* REST sẽ được tải lại khi kết nối trở lại. */ }
  }

  useEffect(() => onRealtime((topic, event) => {
    if (topic === "connected") {
      setRealtime("CONNECTED");
      void loadDashboard();
      Object.entries(commandStatesRef.current).forEach(([code, state]) => {
        if (state.pending && state.requestId) void reconcileRequest(code, state.requestId);
      });
    } else if (topic === "disconnected") {
      setRealtime("DISCONNECTED");
    } else if (topic === "sensors") {
      setDashboard((current) => {
        if (!current || !current.chart[event.sensorCode]) return current;
        const previous = current.latest[event.sensorCode];
        if (previous && new Date(previous.recordedAt) > new Date(event.recordedAt)) return current;
        const points = current.chart[event.sensorCode];
        const duplicate = points.some((point) => point.recordedAt === event.recordedAt && Number(point.value) === Number(event.value));
        return {
          ...current,
          latest: { ...current.latest, [event.sensorCode]: { ...event, stale: false } },
          chart: { ...current.chart, [event.sensorCode]: duplicate ? points : [...points, { value: event.value, recordedAt: event.recordedAt }].slice(-15) },
        };
      });
    } else if (topic === "hardware") {
      void loadDashboard(); // Backend tính lại stale của từng sensor.
    } else if (topic === "devices") {
      setDashboard((current) => current ? {
        ...current, devices: current.devices.map((device) => device.code === event.deviceCode
          ? { ...device, status: event.status } : device),
      } : current);
      setCommandStates((current) => current[event.deviceCode]?.requestId === event.requestId
        ? { ...current, [event.deviceCode]: { requestId: event.requestId, pending: false, type: "success", message: "Thiết bị đã phản hồi." } }
        : current);
    } else if (topic === "notifications" && event.type === "DEVICE_TIMEOUT") {
      setCommandStates((current) => current[event.deviceCode]?.requestId === event.requestId && !current[event.deviceCode]?.publishFailed
        ? { ...current, [event.deviceCode]: { requestId: event.requestId, pending: false, type: "error", message: "Thiết bị không phản hồi. Giữ trạng thái đã xác nhận." } }
        : current);
    }
  }), [loadDashboard]);

  async function handleDeviceControl(deviceCode, action) {
    const device = dashboard?.devices.find((item) => item.code === deviceCode);
    if (!device) return;
    setCommandStates((current) => ({ ...current, [deviceCode]: { pending: true, requestId: null, type: "pending", message: "Đang gửi lệnh..." } }));
    try {
      const result = await api(`/devices/${device.id}/actions`, { method: "POST", body: JSON.stringify({ action }) });
      setCommandStates((current) => ({ ...current, [deviceCode]: {
        requestId: result.requestId, pending: true, type: "pending", message: `Yêu cầu #${result.requestId} đã được nhận. Đang chờ xác nhận.`,
      } }));
      void reconcileRequest(deviceCode, result.requestId); // Bắt kịp phản hồi MQTT đến trước HTTP 202.
      const timer = setTimeout(() => { void reconcileRequest(deviceCode, result.requestId); timers.current.delete(timer); }, 11000);
      timers.current.add(timer);
    } catch (problem) {
      setCommandStates((current) => ({ ...current, [deviceCode]: {
        pending: false, requestId: problem.requestId || null, type: "error",
        publishFailed: problem.code === "MQTT_PUBLISH_FAILED",
        message: problem.code === "MQTT_PUBLISH_FAILED"
          ? `Yêu cầu #${problem.requestId} đã lưu nhưng không gửi được qua MQTT.`
          : "Không gửi được lệnh. Vui lòng thử lại.",
      } }));
    }
  }

  const chartRows = useMemo(() => {
    if (!dashboard) return [];
    return sensors.flatMap((sensor) => (dashboard.chart[sensor.code] || []).map((point) => ({
      recordedAt: point.recordedAt, [sensor.field]: Number(point.value),
    }))).sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
  }, [dashboard]);
  const hardware = dashboard?.hardware;
  const hardwareState = hardware?.status || "CHECKING";

  return (
    <section className="page dashboard">
      <header className="page-header"><h1>Tổng quan</h1><p>Theo dõi môi trường và điều khiển thiết bị.</p></header>
      {error && <div className="system-alert backend-alert" role="alert"><strong>{error}</strong><button type="button" onClick={loadDashboard}>Thử lại</button></div>}
      {realtime === "DISCONNECTED" && <div className="system-alert realtime-alert" role="status">Mất kết nối dữ liệu trực tiếp. Đang nối lại; dữ liệu sẽ được tải lại từ REST.</div>}
      <div className={`hardware-status ${hardwareState.toLowerCase()}`} role="status">
        <strong>{hardwareState === "ONLINE" ? "Phần cứng đang hoạt động" : hardwareState === "OFFLINE" ? "Không nhận được dữ liệu từ phần cứng" : "Đang kiểm tra phần cứng"}</strong>
        <span>Cập nhật lần cuối: {formatDateTime(hardware?.lastSeenAt)}</span>
      </div>
      <div className="sensor-grid">
        {sensors.map((sensor) => <SensorCard key={sensor.code} title={sensor.title}
          value={dashboard?.latest[sensor.code]?.value ?? null}
          unit={dashboard?.latest[sensor.code]?.unit || sensor.unit}
          stale={dashboard?.latest[sensor.code]?.stale || false} />)}
      </div>
      <section className="chart-section">
        <div className="section-heading"><h2>Biểu đồ môi trường</h2></div>
        {loading ? <p>Đang tải...</p> : chartRows.length === 0 ? <p>Chưa có dữ liệu</p> : (
          <div className="chart-container"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="recordedAt" tickFormatter={(value) => formatDateTime(value).slice(11)} minTickGap={30} />
              <YAxis /><Tooltip labelFormatter={formatDateTime} /><Legend />
              <Line type="monotone" dataKey="temperature" connectNulls stroke="#f59e0b" dot={false} name="Nhiệt độ" />
              <Line type="monotone" dataKey="humidity" connectNulls stroke="#2563eb" dot={false} name="Độ ẩm" />
              <Line type="monotone" dataKey="light" connectNulls stroke="#10b981" dot={false} name="Ánh sáng" />
            </LineChart>
          </ResponsiveContainer></div>
        )}
      </section>
      <section className="device-section"><div className="section-heading" />
        <div className="device-grid">{(dashboard?.devices || []).map((device) =>
          <DeviceControl key={device.code} device={device} commandState={commandStates[device.code]}
            hardwareOffline={hardwareState === "OFFLINE"} onControl={handleDeviceControl} />)}</div>
      </section>
    </section>
  );
}
