import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import DeviceControl from "../components/DeviceControl";
import EnvironmentChart from "../components/EnvironmentChart";
import SensorCard from "../components/SensorCard";
import { buildQueryString, requestApi } from "../services/api";
import { onRealtime } from "../services/realtime";
import { formatDateTime } from "../utils/dateTime";
import { capNhatDashboardRealtime } from "../utils/dashboard";

const SENSOR_DEFINITIONS = [
  {
    code: "DHT11_TEMP",
    title: "Nhiệt độ",
    field: "temperature",
    unit: "°C",
  },
  {
    code: "DHT11_HUM",
    title: "Độ ẩm",
    field: "humidity",
    unit: "%RH",
  },
  {
    code: "LDR_LIGHT",
    title: "Ánh sáng",
    field: "light",
    unit: "lux",
  },
];

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [thongBaoLoi, setThongBaoLoi] = useState("");
  const [dangTai, setDangTai] = useState(true);
  const [trangThaiKetNoi, setTrangThaiKetNoi] = useState("CONNECTING");
  const [trangThaiLenh, setTrangThaiLenh] = useState({});

  const dashboardRequestRef = useRef(null);
  const trangThaiLenhRef = useRef(trangThaiLenh);
  const timerYeuCauRef = useRef(new Set());

  // Giữ các sự kiện đến trong lúc REST đang tải để không ghi đè dữ liệu mới.
  const taiDashboard = useCallback(() => {
    if (dashboardRequestRef.current) return dashboardRequestRef.current.promise;

    const request = { events: [], controller: new AbortController() };
    dashboardRequestRef.current = request;
    request.promise = requestApi("/dashboard", { signal: request.controller.signal })
      .then((result) => {
        if (request.controller.signal.aborted) return;
        for (const { topic, event } of request.events) {
          result = capNhatDashboardRealtime(result, topic, event);
        }
        setDashboard(result);
        setThongBaoLoi("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setThongBaoLoi(error.status ? "Không tải được tổng quan." : "Không thể kết nối máy chủ.");
        }
      })
      .finally(() => {
        if (dashboardRequestRef.current === request) {
          dashboardRequestRef.current = null;
          setDangTai(false);
        }
      });
    return request.promise;
  }, []);

  // Đánh dấu thiết bị đã phản hồi
  const danhDauDaPhanHoi = useCallback((deviceCode, requestId, confirmedStatus) => {
    setTrangThaiLenh((trangThaiHienTai) => {
      const command = trangThaiHienTai[deviceCode];
      if (command?.requestId !== requestId) {
        return trangThaiHienTai;
      }

      const lenh = command.action === "ON" ? "bật" : "tắt";
      const trangThai = confirmedStatus === "ON" ? "bật" : "tắt";
      return {
        ...trangThaiHienTai,
        [deviceCode]: {
          ...command,
          pending: false,
          type: "success",
          message: confirmedStatus === command.action
            ? (confirmedStatus === "ON" ? "Đèn đã bật." : "Đèn đã tắt.")
            : "Đã yêu cầu " + lenh + ", thiết bị báo " + trangThai + ".",
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
        command?.publishFailed || command?.type === "success"
      ) {
        return trangThaiHienTai;
      }

      return {
        ...trangThaiHienTai,
        [deviceCode]: {
          ...command,
          pending: false,
          type: "error",
          message: command.action === "ON"
            ? "Chưa nhận được phản hồi cho lệnh bật."
            : "Chưa nhận được phản hồi cho lệnh tắt.",
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
          danhDauDaPhanHoi(deviceCode, requestId, history.status);
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
      if (["sensors", "hardware", "devices"].includes(topic)) {
        dashboardRequestRef.current?.events.push({ topic, event: realtimeEvent });
      }
      switch (topic) {
        case "connected": {
          setTrangThaiKetNoi("CONNECTED");
          const pendingRequest = dashboardRequestRef.current;
          if (pendingRequest) {
            void pendingRequest.promise.then(() => {
              if (!pendingRequest.controller.signal.aborted) void taiDashboard();
            });
          } else {
            void taiDashboard();
          }

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

        case "sensors":
        case "hardware": {
          setDashboard(current => capNhatDashboardRealtime(current, topic, realtimeEvent));
          break;
        }

        case "devices": {
          setDashboard(current => capNhatDashboardRealtime(current, topic, realtimeEvent));

          danhDauDaPhanHoi(
            realtimeEvent.deviceCode,
            realtimeEvent.requestId,
            realtimeEvent.historyStatus,
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
        action,
        pending: true,
        requestId: null,
        type: "pending",
        message: action === "ON" ? "Đang chờ xác nhận bật đèn." : "Đang chờ xác nhận tắt đèn.",
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
          action,
          requestId: result.requestId,
          pending: true,
          type: "pending",
          message: action === "ON" ? "Đang chờ xác nhận bật đèn." : "Đang chờ xác nhận tắt đèn.",
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
          action,
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
    return () => {
      dashboardRequestRef.current?.controller.abort();
      dashboardRequestRef.current = null;
    };
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
          <h1>Dashboard</h1>
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
            type={sensor.field}
            value={dashboard?.latest[sensor.code]?.value ?? null}
            unit={dashboard?.latest[sensor.code]?.unit || sensor.unit}
          />
        ))}

      </div>

      <EnvironmentChart chart={dashboard?.chart} loading={dangTai} />

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
