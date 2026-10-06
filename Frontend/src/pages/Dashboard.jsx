import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import DeviceControl from "../components/DeviceControl";
import SensorCard from "../components/SensorCard";
import { requestApi, buildQueryString } from "../services/api";
import { onRealtime } from "../services/realtime";
import { formatDateTime } from "../utils/dateTime";
import { formatValue } from "../utils/formatValue";

const SENSOR_DEFINITIONS = [
  { code: "DHT11_TEMP", title: "Temperature", field: "temperature", unit: "°C" },
  { code: "DHT11_HUM", title: "Humidity", field: "humidity", unit: "%RH" },
  { code: "LDR_LIGHT", title: "Light", field: "light", unit: "lux" },
];
const CHART_UNITS = { "Nhiệt độ": "°C", "Độ ẩm": "%RH", "Ánh sáng": "lux" };
const chartTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
});

function formatChartTime(value) {
  return chartTimeFormatter.format(new Date(value));
}

// Chuẩn bị dữ liệu biểu đồ: ghép ba cảm biến theo mốc thời gian.
function buildChartRows(dashboard) {
  if (!dashboard) return [];
  const rowsByTime = new Map();
  for (const sensor of SENSOR_DEFINITIONS) {
    for (const point of dashboard.chart[sensor.code] || []) {
      const row = rowsByTime.get(point.recordedAt) || { recordedAt: point.recordedAt };
      row[sensor.field] = Number(point.value);
      rowsByTime.set(point.recordedAt, row);
    }
  }
  return Array.from(rowsByTime.values()).sort(
    (first, second) => new Date(first.recordedAt) - new Date(second.recordedAt),
  );
}

// Cập nhật số đo và 15 điểm gần nhất từ sự kiện cảm biến.
function applySensorUpdate(dashboard, sensorEvent) {
  if (!dashboard || !dashboard.chart[sensorEvent.sensorCode]) return dashboard;
  const previousReading = dashboard.latest[sensorEvent.sensorCode];
  if (previousReading && new Date(previousReading.recordedAt) > new Date(sensorEvent.recordedAt)) {
    return dashboard;
  }

  const points = dashboard.chart[sensorEvent.sensorCode];
  const isDuplicate = points.some((point) =>
    point.recordedAt === sensorEvent.recordedAt && Number(point.value) === Number(sensorEvent.value),
  );
  const nextPoints = isDuplicate
    ? points
    : [...points, { value: sensorEvent.value, recordedAt: sensorEvent.recordedAt }].slice(-15);

  return {
    ...dashboard,
    latest: { ...dashboard.latest, [sensorEvent.sensorCode]: { ...sensorEvent, stale: false } },
    chart: { ...dashboard.chart, [sensorEvent.sensorCode]: nextPoints },
  };
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [connectionState, setConnectionState] = useState("CONNECTING");
  const [commandStates, setCommandStates] = useState({});
  const commandStatesRef = useRef(commandStates);
  const requestTimersRef = useRef(new Set());

  // Tải số đo, trạng thái phần cứng và LED từ REST.
  const loadDashboard = useCallback(async () => {
    try {
      const result = await requestApi("/dashboard");
      setDashboard(result);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.status ? "Không tải được tổng quan." : "Không thể kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cập nhật tiến độ của lệnh hiện tại; bỏ qua phản hồi của lệnh cũ.
  const markCommandConfirmed = useCallback((deviceCode, requestId) => {
    setCommandStates((currentStates) => {
      if (currentStates[deviceCode]?.requestId !== requestId) return currentStates;
      return {
        ...currentStates,
        [deviceCode]: { requestId, pending: false, type: "success", message: "Thiết bị đã phản hồi." },
      };
    });
  }, []);

  const markCommandTimedOut = useCallback((deviceCode, requestId) => {
    setCommandStates((currentStates) => {
      const command = currentStates[deviceCode];
      if (command?.requestId !== requestId || command?.publishFailed) return currentStates;
      return {
        ...currentStates,
        [deviceCode]: { requestId, pending: false, type: "error", message: "Thiết bị không phản hồi." },
      };
    });
  }, []);

  // Đối chiếu history trên Backend để biết lệnh đã xác nhận hay hết thời gian chờ.
  const reconcileRequest = useCallback(async (deviceCode, requestId) => {
    try {
      const parameters = buildQueryString({ searchField: "ID", search: requestId, page: 0, size: 1 });
      const historyPage = await requestApi(`/action-history?${parameters}`);
      const history = historyPage.content.find((record) => record.id === requestId);
      if (!history) return;

      if (history.deliveryState === "CONFIRMED") {
        markCommandConfirmed(deviceCode, requestId);
        void loadDashboard();
      } else if (history.deliveryState === "TIMEOUT") {
        markCommandTimedOut(deviceCode, requestId);
      }
    } catch {
      // Thử lại qua REST khi WebSocket kết nối lại.
    }
  }, [loadDashboard, markCommandConfirmed, markCommandTimedOut]);

  // Nhận sự kiện STOMP và cập nhật phần giao diện tương ứng.
  const handleRealtimeEvent = useCallback((topic, realtimeEvent) => {
    switch (topic) {
      case "connected":
        setConnectionState("CONNECTED");
        // Tải lại dữ liệu sau khi WebSocket kết nối lại.
        void loadDashboard();
        for (const [deviceCode, command] of Object.entries(commandStatesRef.current)) {
          if (command.pending && command.requestId) {
            void reconcileRequest(deviceCode, command.requestId);
          }
        }
        break;
      case "disconnected":
        setConnectionState("DISCONNECTED");
        break;
      case "sensors":
        setDashboard((currentDashboard) => applySensorUpdate(currentDashboard, realtimeEvent));
        break;
      case "hardware":
        // Backend tính lại dữ liệu cũ của từng sensor.
        void loadDashboard();
        break;
      case "devices":
        setDashboard((currentDashboard) => {
          if (!currentDashboard) return currentDashboard;
          const devices = currentDashboard.devices.map((device) =>
            device.code === realtimeEvent.deviceCode ? { ...device, status: realtimeEvent.status } : device,
          );
          return { ...currentDashboard, devices };
        });
        markCommandConfirmed(realtimeEvent.deviceCode, realtimeEvent.requestId);
        break;
      case "notifications":
        if (realtimeEvent.type === "DEVICE_TIMEOUT") {
          markCommandTimedOut(realtimeEvent.deviceCode, realtimeEvent.requestId);
        }
        break;
    }
  }, [loadDashboard, reconcileRequest, markCommandConfirmed, markCommandTimedOut]);

  // Gửi lệnh ON/OFF; trạng thái LED chỉ đổi khi Backend xác nhận.
  async function handleDeviceControl(deviceCode, action) {
    const device = dashboard?.devices.find((device) => device.code === deviceCode);
    if (!device) return;

    setCommandStates((currentStates) => ({
      ...currentStates,
      [deviceCode]: { pending: true, requestId: null, type: "pending", message: "Đang gửi lệnh..." },
    }));
    try {
      const result = await requestApi(`/devices/${device.id}/actions`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      setCommandStates((currentStates) => ({
        ...currentStates,
        [deviceCode]: {
          requestId: result.requestId,
          pending: true,
          type: "pending",
          message: "Đang chờ thiết bị phản hồi.",
        },
      }));
      // Bắt kịp phản hồi MQTT đến trước response HTTP.
      void reconcileRequest(deviceCode, result.requestId);
      const timer = setTimeout(() => {
        void reconcileRequest(deviceCode, result.requestId);
        requestTimersRef.current.delete(timer);
      }, 11000);
      requestTimersRef.current.add(timer);
    } catch (error) {
      const publishFailed = error.code === "MQTT_PUBLISH_FAILED";
      setCommandStates((currentStates) => ({
        ...currentStates,
        [deviceCode]: {
          pending: false,
          requestId: error.requestId || null,
          type: "error",
          publishFailed,
          message: publishFailed
            ? "Lệnh đã lưu nhưng chưa gửi được đến thiết bị."
            : "Không gửi được lệnh. Thử lại.",
        },
      }));
    }
  }

  // Khởi tạo dữ liệu, đăng ký realtime và dọn timer khi rời trang.
  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    commandStatesRef.current = commandStates;
  }, [commandStates]);

  useEffect(() => {
    const requestTimers = requestTimersRef.current;
    return () => requestTimers.forEach(clearTimeout);
  }, []);

  useEffect(() => onRealtime(handleRealtimeEvent), [handleRealtimeEvent]);

  const chartRows = useMemo(() => buildChartRows(dashboard), [dashboard]);
  const hardware = dashboard?.hardware;
  const hardwareStatus = hardware?.status || "CHECKING";

  return (
    <section className="page dashboard">
      <div className="dashboard-heading-row">
        <header className="page-header"><h1>Tổng quan</h1></header>
        <div className={`hardware-status ${hardwareStatus.toLowerCase()}`} role="status">
          <strong>{hardwareStatus === "ONLINE" ? "Phần cứng đang hoạt động" : hardwareStatus === "OFFLINE" ? "Không nhận được dữ liệu từ phần cứng" : "Đang kiểm tra phần cứng"}</strong>
          <span>Cập nhật lần cuối: {formatDateTime(hardware?.lastSeenAt)}</span>
        </div>
      </div>
      {errorMessage && <div className="system-alert backend-alert" role="alert"><strong>{errorMessage}</strong><button type="button" onClick={loadDashboard}>Thử lại</button></div>}
      {connectionState === "DISCONNECTED" && <div className="system-alert realtime-alert" role="status">Mất kết nối cập nhật trực tiếp. Đang kết nối lại.</div>}
      <div className="sensor-grid">
        {SENSOR_DEFINITIONS.map((sensor) => <SensorCard key={sensor.code} title={sensor.title}
          value={dashboard?.latest[sensor.code]?.value ?? null}
          unit={dashboard?.latest[sensor.code]?.unit || sensor.unit}
          />)}
      </div>
      <section className="chart-section">
        <div className="section-heading"><h2>Biểu đồ môi trường</h2>
          <span className="chart-note">Nhiệt độ (°C) · Độ ẩm (%RH) · Ánh sáng (lux)</span></div>
        {isLoading ? <p>Đang tải...</p> : chartRows.length === 0 ? <p>Chưa có dữ liệu</p> : (
          <div className="chart-container"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRows} margin={{ top: 12, right: 6, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="recordedAt" tickFormatter={formatChartTime} minTickGap={32}
                tick={{ fontSize: 11 }} axisLine stroke="#64748b" tickLine stroke="#64748b" />
              <YAxis width={65} domain={[0, "auto"]} tickFormatter={formatValue}
                tick={{ fontSize: 10 }} axisLine stroke="#64748b"
                label={{ value: "°C / %RH / lux", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
              <Tooltip labelFormatter={formatDateTime}
                formatter={(value, name) => [`${formatValue(value)} ${CHART_UNITS[name] || ""}`, name]} />
              <Legend />
              <Line type="monotone" dataKey="temperature" connectNulls
                stroke="#dc2626" strokeWidth={2.5} dot={false} activeDot name="Nhiệt độ" isAnimationActive={false} />
              <Line type="monotone" dataKey="humidity" connectNulls
                stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot name="Độ ẩm" isAnimationActive={false} />
              <Line type="monotone" dataKey="light" connectNulls
                stroke="#d97706" strokeWidth={2.5} dot={false} activeDot name="Ánh sáng" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer></div>
        )}
      </section>
      <section className="device-section"><div className="section-heading" />
        <div className="device-grid">{(dashboard?.devices || []).map((device) =>
          <DeviceControl key={device.code} device={device} commandState={commandStates[device.code]}
            hardwareOffline={hardwareStatus === "OFFLINE"} onControl={handleDeviceControl} />)}</div>
      </section>
    </section>
  );
}
