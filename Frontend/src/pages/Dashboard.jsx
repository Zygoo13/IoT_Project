import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DeviceControl from "../components/DeviceControl";
import SensorCard from "../components/SensorCard";
import { dashboardPoints, devices as mockDevices, sensors } from "../data/mockData";
import { formatDateTime } from "../utils/dateTime";

const HARDWARE_OFFLINE_THRESHOLD = 30_000;
const DEVICE_COMMAND_TIMEOUT = 10_000;
const MOCK_CONFIRMATION_DELAY = 700;
const DEVICE_STORAGE_KEY = "device-statuses";
const MOCK_TELEMETRY_ENABLED = true;
const MOCK_DEVICE_CONFIRMATIONS = true;
const MOCK_BACKEND_AVAILABLE = true;
const MOCK_REALTIME_CONNECTED = true;

function loadSavedDevices() {
  try {
    const savedStatuses = JSON.parse(localStorage.getItem(DEVICE_STORAGE_KEY) || "{}");

    return mockDevices.map((device) => ({
      ...device,
      status: savedStatuses[device.code] || device.status,
    }));
  } catch {
    return mockDevices;
  }
}

function saveDeviceStatuses(devices) {
  const statuses = Object.fromEntries(devices.map((device) => [device.code, device.status]));

  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(statuses));
  } catch {
    // The mock still works when browser storage is unavailable; only reload restore is skipped.
  }
}

function createMockChartPoint(lastId) {
  return {
    id: lastId + 1,
    temperature: Number((25 + Math.random() * 10).toFixed(1)),
    humidity: Math.round(50 + Math.random() * 40),
    light: Math.round(200 + Math.random() * 600),
    recordedAt: new Date().toLocaleTimeString("en-GB", { hour12: false }),
  };
}

function Dashboard() {
  const [chartPoints, setChartPoints] = useState(dashboardPoints);
  const [devices, setDevices] = useState(() =>
    mockDevices.map((device) => ({ ...device, status: "UNKNOWN" })),
  );
  const [commandStates, setCommandStates] = useState({});
  const [lastTelemetryAt, setLastTelemetryAt] = useState(null);
  const [hardwareState, setHardwareState] = useState("CHECKING");
  const hardwareOffline = hardwareState === "OFFLINE";
  const latestPoint = chartPoints[chartPoints.length - 1];

  useEffect(() => {
    if (!MOCK_BACKEND_AVAILABLE) {
      return undefined;
    }

    // Mock the Dashboard REST load. Production will load these confirmed states from Backend/Database.
    const timer = setTimeout(() => setDevices(loadSavedDevices()), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Mock a new presentation point every 2 seconds.
    // Later this can be replaced by STOMP over native WebSocket.
    const interval = setInterval(() => {
      if (!MOCK_BACKEND_AVAILABLE || !MOCK_REALTIME_CONNECTED || !MOCK_TELEMETRY_ENABLED) {
        return;
      }

      setLastTelemetryAt(Date.now());
      setHardwareState("ONLINE");
      setChartPoints((currentPoints) => {
        const lastPoint = currentPoints[currentPoints.length - 1];
        const newPoint = createMockChartPoint(lastPoint ? lastPoint.id : 1000);

        return [...currentPoints, newPoint].slice(-15);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!MOCK_BACKEND_AVAILABLE || !MOCK_REALTIME_CONNECTED) {
      return undefined;
    }

    const timer = setTimeout(() => setHardwareState("OFFLINE"), HARDWARE_OFFLINE_THRESHOLD);
    return () => clearTimeout(timer);
  }, [lastTelemetryAt]);

  function handleDeviceControl(deviceCode, action) {
    const requestId = Date.now();
    const actionLabel = action === "ON" ? "bật" : "tắt";

    setCommandStates((current) => ({
      ...current,
      [deviceCode]: {
        requestId,
        pending: true,
        action,
        message: `Đang gửi lệnh ${actionLabel}...`,
        type: "pending",
      },
    }));

    const timeout = setTimeout(() => {
      setCommandStates((current) => {
        if (current[deviceCode]?.requestId !== requestId) {
          return current;
        }

        return {
          ...current,
          [deviceCode]: {
            ...current[deviceCode],
            pending: false,
            message: "Thiết bị không phản hồi. Giữ nguyên trạng thái trước đó.",
            type: "error",
          },
        };
      });
    }, DEVICE_COMMAND_TIMEOUT);

    // Set MOCK_DEVICE_CONFIRMATIONS to false to see the 10-second timeout state.
    if (!MOCK_DEVICE_CONFIRMATIONS) {
      return;
    }

    // Mock a valid ESP32 confirmation. The confirmed badge changes only here.
    setTimeout(() => {
      clearTimeout(timeout);
      setDevices((currentDevices) => {
        const confirmedDevices = currentDevices.map((device) =>
          device.code === deviceCode ? { ...device, status: action } : device,
        );

        saveDeviceStatuses(confirmedDevices);
        return confirmedDevices;
      });

      setCommandStates((current) => {
        if (current[deviceCode]?.requestId !== requestId) {
          return current;
        }

        return {
          ...current,
          [deviceCode]: {
            ...current[deviceCode],
            pending: false,
            message: "Đã cập nhật trạng thái.",
            type: "success",
          },
        };
      });
    }, MOCK_CONFIRMATION_DELAY);
  }

  return (
    <section className="page dashboard">
      <header className="page-header">
        <h1>Tổng quan</h1>
        <p>Theo dõi môi trường và điều khiển thiết bị.</p>
      </header>

      {!MOCK_BACKEND_AVAILABLE && (
        <div className="system-alert backend-alert" role="alert">
          <strong>Không thể kết nối máy chủ</strong>
          <span>Chưa tải được dữ liệu. Hãy thử lại khi máy chủ hoạt động.</span>
        </div>
      )}

      {!MOCK_REALTIME_CONNECTED && (
        <div className="system-alert realtime-alert" role="alert">
          <strong>Mất kết nối dữ liệu trực tiếp</strong>
          <span>Dữ liệu mới đang tạm dừng. Các giá trị cũ vẫn được giữ lại.</span>
        </div>
      )}

      <div className={`hardware-status ${hardwareState.toLowerCase()}`} role={hardwareOffline ? "alert" : "status"}>
        {hardwareState === "CHECKING" && (
          <>
            <strong>Đang kiểm tra phần cứng</strong>
            <span>Chưa nhận được dữ liệu mới.</span>
          </>
        )}
        {hardwareState === "ONLINE" && (
          <>
            <strong>Phần cứng đang hoạt động</strong>
            <span>Cập nhật lần cuối: {formatDateTime(lastTelemetryAt)}</span>
          </>
        )}
        {hardwareState === "OFFLINE" && (
          <>
            <strong>Không nhận được dữ liệu từ phần cứng</strong>
            <span>Đã quá 30 giây. Các giá trị bên dưới là dữ liệu cũ. Lần cuối: {lastTelemetryAt ? formatDateTime(lastTelemetryAt) : "Chưa có"}</span>
          </>
        )}
      </div>

      <div className="sensor-grid">
        {sensors.map((sensor) => (
          <SensorCard
            key={sensor.code}
            title={sensor.name}
            value={latestPoint?.[sensor.field]}
            unit={sensor.unit}
            stale={hardwareOffline}
          />
        ))}
      </div>

      <section className="chart-section">
        <div className="section-heading">
          <h2>Biểu đồ môi trường</h2>
          <p>15 lần đo gần nhất</p>
        </div>
        {chartPoints.length === 0 ? (
          <p>Chưa có dữ liệu</p>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="recordedAt" minTickGap={30} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Line type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Nhiệt độ" />
                <Line type="monotone" dataKey="humidity" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Độ ẩm" />
                <Line type="monotone" dataKey="light" stroke="#10b981" strokeWidth={2.5} dot={false} name="Ánh sáng" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="device-section">
        <div className="section-heading">
          <h2>Điều khiển thiết bị</h2>
          <p>Bật hoặc tắt từng đèn LED.</p>
        </div>
        <div className="device-grid">
          {devices.map((device) => (
            <DeviceControl
              key={device.code}
              device={device}
              commandState={commandStates[device.code]}
              hardwareOffline={hardwareOffline}
              onControl={handleDeviceControl}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

export default Dashboard;
