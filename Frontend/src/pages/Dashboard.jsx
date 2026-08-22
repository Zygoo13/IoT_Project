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
  const [devices, setDevices] = useState(mockDevices);
  const [pendingDevices, setPendingDevices] = useState({});
  const latestPoint = chartPoints[chartPoints.length - 1];

  useEffect(() => {
    // Mock a new presentation point every 2 seconds.
    // Later this can be replaced by STOMP over native WebSocket.
    const interval = setInterval(() => {
      setChartPoints((currentPoints) => {
        const lastPoint = currentPoints[currentPoints.length - 1];
        const newPoint = createMockChartPoint(lastPoint ? lastPoint.id : 1000);

        return [...currentPoints, newPoint].slice(-15);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  function handleDeviceControl(deviceCode, action) {
    setPendingDevices((current) => ({
      ...current,
      [deviceCode]: true,
    }));

    // Later this will call the backend API and wait for ESP32 confirmation.
    setTimeout(() => {
      setDevices((currentDevices) =>
        currentDevices.map((device) =>
          device.code === deviceCode ? { ...device, status: action } : device,
        ),
      );

      setPendingDevices((current) => ({
        ...current,
        [deviceCode]: false,
      }));
    }, 700);
  }

  return (
    <section className="page dashboard">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Monitor the latest environment readings and control connected devices.</p>
      </header>

      <div className="sensor-grid">
        {sensors.map((sensor) => (
          <SensorCard
            key={sensor.code}
            title={sensor.name}
            value={latestPoint?.[sensor.field]}
            unit={sensor.unit}
          />
        ))}
      </div>

      <section className="chart-section">
        <div className="section-heading">
          <h2>Realtime Environment Data</h2>
          <p>Latest 15 measurement points</p>
        </div>
        {chartPoints.length === 0 ? (
          <p>No data</p>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="recordedAt" minTickGap={30} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Line type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Temperature" />
                <Line type="monotone" dataKey="humidity" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Humidity" />
                <Line type="monotone" dataKey="light" stroke="#10b981" strokeWidth={2.5} dot={false} name="Light" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="device-section">
        <div className="section-heading">
          <h2>Device Controls</h2>
          <p>Send commands to the configured LED devices.</p>
        </div>
        <div className="device-grid">
          {devices.map((device) => (
            <DeviceControl
              key={device.code}
              device={device}
              waitingConfirmation={pendingDevices[device.code]}
              onControl={handleDeviceControl}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

export default Dashboard;
