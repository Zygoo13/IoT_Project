import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
import { buildQueryString, requestApi } from "../services/api";
import { onRealtime } from "../services/realtime";
import { formatDateTime } from "../utils/dateTime";
import { formatValue } from "../utils/formatValue";

const SENSOR_DEFINITIONS = [
  {
    code: "DHT11_TEMP",
    title: "Temperature",
    field: "temperature",
    unit: "°C",
  },
  {
    code: "DHT11_HUM",
    title: "Humidity",
    field: "humidity",
    unit: "%RH",
  },
  {
    code: "LDR_LIGHT",
    title: "Light",
    field: "light",
    unit: "lux",
  },
];

const CHART_UNITS = {
  "Nhiệt độ": "°C",
  "Độ ẩm": "%RH",
  "Ánh sáng": "lux",
};

const dinhDangGioBieuDo = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
});

function formatChartTime(value) {
  return dinhDangGioBieuDo.format(new Date(value));
}

// Chuẩn bị dữ liệu cho biểu đồ
function taoDuLieuBieuDo(dashboard) {
  if (!dashboard) {
    return [];
  }

  const duLieuTheoThoiGian = new Map();

  for (const sensor of SENSOR_DEFINITIONS) {
    const cacDiem = dashboard.chart[sensor.code] || [];

    for (const point of cacDiem) {
      const row = duLieuTheoThoiGian.get(point.recordedAt) || {
        recordedAt: point.recordedAt,
      };

      row[sensor.field] = Number(point.value);
      duLieuTheoThoiGian.set(point.recordedAt, row);
    }
  }

  return Array.from(duLieuTheoThoiGian.values()).sort(
    (first, second) =>
      new Date(first.recordedAt) - new Date(second.recordedAt),
  );
}

// Cập nhật dữ liệu cảm biến realtime
function capNhatCamBienRealtime(dashboard, sensorEvent) {
  if (!dashboard || !dashboard.chart[sensorEvent.sensorCode]) {
    return dashboard;
  }

  const duLieuCu = dashboard.latest[sensorEvent.sensorCode];

  if (
    duLieuCu &&
    new Date(duLieuCu.recordedAt) > new Date(sensorEvent.recordedAt)
  ) {
    return dashboard;
  }

  const cacDiem = dashboard.chart[sensorEvent.sensorCode];

  const biTrung = cacDiem.some(
    (point) =>
      point.recordedAt === sensorEvent.recordedAt &&
      Number(point.value) === Number(sensorEvent.value),
  );

  const cacDiemMoi = biTrung
    ? cacDiem
    : [
      ...cacDiem,
      {
        value: sensorEvent.value,
        recordedAt: sensorEvent.recordedAt,
      },
    ].slice(-15);

  return {
    ...dashboard,
    latest: {
      ...dashboard.latest,
      [sensorEvent.sensorCode]: {
        ...sensorEvent,
        stale: false,
      },
    },
    chart: {
      ...dashboard.chart,
      [sensorEvent.sensorCode]: cacDiemMoi,
    },
  };
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [thongBaoLoi, setThongBaoLoi] = useState("");
  const [dangTai, setDangTai] = useState(true);
  const [trangThaiKetNoi, setTrangThaiKetNoi] = useState("CONNECTING");
  const [trangThaiLenh, setTrangThaiLenh] = useState({});

  const trangThaiLenhRef = useRef(trangThaiLenh);
  const timerYeuCauRef = useRef(new Set());

  // Tải dữ liệu Dashboard
  const taiDashboard = useCallback(async () => {
    try {
      const result = await requestApi("/dashboard");

      setDashboard(result);
      setThongBaoLoi("");
    } catch (error) {
      setThongBaoLoi(
        error.status
          ? "Không tải được tổng quan."
          : "Không thể kết nối máy chủ.",
      );
    } finally {
      setDangTai(false);
    }
  }, []);

  // Đánh dấu thiết bị đã phản hồi
  const danhDauDaPhanHoi = useCallback((deviceCode, requestId) => {
    setTrangThaiLenh((trangThaiHienTai) => {
      if (trangThaiHienTai[deviceCode]?.requestId !== requestId) {
        return trangThaiHienTai;
      }

      return {
        ...trangThaiHienTai,
        [deviceCode]: {
          requestId,
          pending: false,
          type: "success",
          message: "Thiết bị đã phản hồi.",
        },
      };
    });
  }, []);

  // Đánh dấu thiết bị không phản hồi
  const danhDauHetThoiGian = useCallback((deviceCode, requestId) => {
    setTrangThaiLenh((trangThaiHienTai) => {
      const command = trangThaiHienTai[deviceCode];

      if (
        command?.requestId !== requestId ||
        command?.publishFailed
      ) {
        return trangThaiHienTai;
      }

      return {
        ...trangThaiHienTai,
        [deviceCode]: {
          requestId,
          pending: false,
          type: "error",
          message: "Thiết bị không phản hồi.",
        },
      };
    });
  }, []);

  // Kiểm tra lại trạng thái lệnh trên Backend
  const kiemTraYeuCau = useCallback(
    async (deviceCode, requestId) => {
      try {
        const query = buildQueryString({
          searchField: "ID",
          search: requestId,
          page: 0,
          size: 1,
        });

        const historyPage = await requestApi(`/action-history?${query}`);

        const history = historyPage.content.find(
          (record) => record.id === requestId,
        );

        if (!history) {
          return;
        }

        if (history.deliveryState === "CONFIRMED") {
          danhDauDaPhanHoi(deviceCode, requestId);
          void taiDashboard();
        } else if (history.deliveryState === "TIMEOUT") {
          danhDauHetThoiGian(deviceCode, requestId);
        }
      } catch {
        // Thử lại khi WebSocket kết nối lại
      }
    },
    [taiDashboard, danhDauDaPhanHoi, danhDauHetThoiGian],
  );

  // Xử lý dữ liệu realtime
  const xuLyRealtime = useCallback(
    (topic, realtimeEvent) => {
      switch (topic) {
        case "connected": {
          setTrangThaiKetNoi("CONNECTED");
          void taiDashboard();

          for (const [deviceCode, command] of Object.entries(
            trangThaiLenhRef.current,
          )) {
            if (command.pending && command.requestId) {
              void kiemTraYeuCau(deviceCode, command.requestId);
            }
          }

          break;
        }

        case "disconnected": {
          setTrangThaiKetNoi("DISCONNECTED");
          break;
        }

        case "sensors": {
          setDashboard((dashboardHienTai) =>
            capNhatCamBienRealtime(dashboardHienTai, realtimeEvent),
          );
          break;
        }

        case "hardware": {
          void taiDashboard();
          break;
        }

        case "devices": {
          setDashboard((dashboardHienTai) => {
            if (!dashboardHienTai) {
              return dashboardHienTai;
            }

            const devices = dashboardHienTai.devices.map((device) =>
              device.code === realtimeEvent.deviceCode
                ? { ...device, status: realtimeEvent.status }
                : device,
            );

            return {
              ...dashboardHienTai,
              devices,
            };
          });

          danhDauDaPhanHoi(
            realtimeEvent.deviceCode,
            realtimeEvent.requestId,
          );

          break;
        }

        case "notifications": {
          if (realtimeEvent.type === "DEVICE_TIMEOUT") {
            danhDauHetThoiGian(
              realtimeEvent.deviceCode,
              realtimeEvent.requestId,
            );
          }

          break;
        }
      }
    },
    [taiDashboard, kiemTraYeuCau, danhDauDaPhanHoi, danhDauHetThoiGian],
  );

  // Gửi lệnh điều khiển thiết bị
  async function dieuKhienThietBi(deviceCode, action) {
    const device = dashboard?.devices.find(
      (device) => device.code === deviceCode,
    );

    if (!device) {
      return;
    }

    setTrangThaiLenh((trangThaiHienTai) => ({
      ...trangThaiHienTai,
      [deviceCode]: {
        pending: true,
        requestId: null,
        type: "pending",
        message: "Đang gửi lệnh...",
      },
    }));

    try {
      const result = await requestApi(`/devices/${device.id}/actions`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });

      setTrangThaiLenh((trangThaiHienTai) => ({
        ...trangThaiHienTai,
        [deviceCode]: {
          requestId: result.requestId,
          pending: true,
          type: "pending",
          message: "Đang chờ thiết bị phản hồi.",
        },
      }));

      // Kiểm tra trường hợp phản hồi đến sớm
      void kiemTraYeuCau(deviceCode, result.requestId);

      const timer = setTimeout(() => {
        void kiemTraYeuCau(deviceCode, result.requestId);
        timerYeuCauRef.current.delete(timer);
      }, 11000);

      timerYeuCauRef.current.add(timer);
    } catch (error) {
      const publishFailed = error.code === "MQTT_PUBLISH_FAILED";

      setTrangThaiLenh((trangThaiHienTai) => ({
        ...trangThaiHienTai,
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

  useEffect(() => {
    void taiDashboard();
  }, [taiDashboard]);

  useEffect(() => {
    trangThaiLenhRef.current = trangThaiLenh;
  }, [trangThaiLenh]);

  useEffect(() => {
    const cacTimer = timerYeuCauRef.current;

    return () => {
      cacTimer.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    return onRealtime(xuLyRealtime);
  }, [xuLyRealtime]);

  const duLieuBieuDo = useMemo(
    () => taoDuLieuBieuDo(dashboard),
    [dashboard],
  );

  const phanCung = dashboard?.hardware;
  const trangThaiPhanCung = phanCung?.status || "CHECKING";

  const thongBaoPhanCung =
    trangThaiPhanCung === "ONLINE"
      ? "Phần cứng đang hoạt động"
      : trangThaiPhanCung === "OFFLINE"
        ? "Không nhận được dữ liệu từ phần cứng"
        : "Đang kiểm tra phần cứng";

  return (
    <section className="page dashboard">
      <div className="dashboard-heading-row">
        <header className="page-header">
          <h1>Tổng quan</h1>
        </header>

        <div
          className={`hardware-status ${trangThaiPhanCung.toLowerCase()}`}
          role="status"
        >
          <strong>{thongBaoPhanCung}</strong>

          <span>
            Cập nhật lần cuối: {formatDateTime(phanCung?.lastSeenAt)}
          </span>
        </div>
      </div>

      {thongBaoLoi && (
        <div className="system-alert backend-alert" role="alert">
          <strong>{thongBaoLoi}</strong>

          <button type="button" onClick={taiDashboard}>
            Thử lại
          </button>
        </div>
      )}

      {trangThaiKetNoi === "DISCONNECTED" && (
        <div className="system-alert realtime-alert" role="status">
          Mất kết nối cập nhật trực tiếp. Đang kết nối lại.
        </div>
      )}

      <div className="sensor-grid">
        {SENSOR_DEFINITIONS.map((sensor) => (
          <SensorCard
            key={sensor.code}
            title={sensor.title}
            value={dashboard?.latest[sensor.code]?.value ?? null}
            unit={dashboard?.latest[sensor.code]?.unit || sensor.unit}
          />
        ))}
      </div>

      <section className="chart-section">
        <div className="section-heading">
          <h2>Biểu đồ môi trường</h2>

          <span className="chart-note">
            Nhiệt độ (°C) · Độ ẩm (%RH) · Ánh sáng (lux)
          </span>
        </div>

        {dangTai ? (
          <p>Đang tải...</p>
        ) : duLieuBieuDo.length === 0 ? (
          <p>Chưa có dữ liệu</p>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={duLieuBieuDo}
                margin={{ top: 12, right: 6, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="recordedAt"
                  tickFormatter={formatChartTime}
                  minTickGap={32}
                  tick={{ fontSize: 11 }}
                  axisLine={{ stroke: "#64748b" }}
                  tickLine={{ stroke: "#64748b" }}
                />

                <YAxis
                  width={65}
                  domain={[0, "auto"]}
                  tickFormatter={formatValue}
                  tick={{ fontSize: 10 }}
                  axisLine={{ stroke: "#64748b" }}
                  label={{
                    value: "°C / %RH / lux",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 10 },
                  }}
                />

                <Tooltip
                  labelFormatter={formatDateTime}
                  formatter={(value, name) => [
                    `${formatValue(value)} ${CHART_UNITS[name] || ""}`,
                    name,
                  ]}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="temperature"
                  connectNulls
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot
                  name="Nhiệt độ"
                  isAnimationActive={false}
                />

                <Line
                  type="monotone"
                  dataKey="humidity"
                  connectNulls
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot
                  name="Độ ẩm"
                  isAnimationActive={false}
                />

                <Line
                  type="monotone"
                  dataKey="light"
                  connectNulls
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot
                  name="Ánh sáng"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="device-section">
        <div className="section-heading" />

        <div className="device-grid">
          {(dashboard?.devices || []).map((device) => (
            <DeviceControl
              key={device.code}
              device={device}
              commandState={trangThaiLenh[device.code]}
              hardwareOffline={trangThaiPhanCung === "OFFLINE"}
              onControl={dieuKhienThietBi}
            />
          ))}
        </div>
      </section>
    </section>
  );
}