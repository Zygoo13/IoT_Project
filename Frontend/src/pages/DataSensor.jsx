import { useEffect, useState } from "react";

import Pagination from "../components/Pagination";
import { buildQueryString, requestApi } from "../services/api";
import { onRealtime } from "../services/realtime";
import { formatDateTime, parseSearchTimeRange } from "../utils/dateTime";
import { formatValue } from "../utils/formatValue";

const PAGE_SIZE = 5;

const EMPTY_PAGE = {
  content: [],
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
};

const SENSOR_NAMES = {
  TEMPERATURE: "Nhiệt độ",
  HUMIDITY: "Độ ẩm",
  LIGHT: "Ánh sáng",
};

export default function DataSensor() {
  const [trangHienTai, setTrangHienTai] = useState(0);
  const [trangCamBien, setTrangCamBien] = useState(EMPTY_PAGE);
  const [soDongMoiTrang, setSoDongMoiTrang] = useState(PAGE_SIZE);

  const [tuKhoa, setTuKhoa] = useState("");
  const [loaiCamBien, setLoaiCamBien] = useState("");
  const [loaiCamBienDaApDung, setLoaiCamBienDaApDung] = useState("");
  const [tuKhoaDaApDung, setTuKhoaDaApDung] = useState("");
  const [thoiGianDaApDung, setThoiGianDaApDung] = useState(null);
  const [loiTimKiem, setLoiTimKiem] = useState("");

  const [thuTuSapXep, setThuTuSapXep] = useState("DESC");

  const [thongBaoLoi, setThongBaoLoi] = useState("");

  const [dangTai, setDangTai] = useState(true);
  const [lanLamMoi, setLanLamMoi] = useState(0);

  function taiLaiTrang() {
    setLanLamMoi((lanHienTai) => lanHienTai + 1);
  }

  function xuLyTimKiem(event) {
    event.preventDefault();

    try {
      const timeRange = loaiCamBien === "TIME" ? parseSearchTimeRange(tuKhoa) : null;
      setThoiGianDaApDung(timeRange);
    } catch (error) {
      setLoiTimKiem(error.message);
      return;
    }
    setLoiTimKiem("");
    setTuKhoaDaApDung(loaiCamBien === "TIME" ? "" : tuKhoa.trim());
    setLoaiCamBienDaApDung(loaiCamBien);
    setTrangHienTai(0);
  }

  function doiThuTuSapXep(event) {
    setThuTuSapXep(event.target.value);
    setTrangHienTai(0);
  }

  // Ba reading thường đến cùng lúc; tải lại một lần và giữ bảng trong lúc chờ.
  useEffect(() => {
    let refreshTimer;
    const unsubscribe = onRealtime((topic) => {
      if (topic === "connected") {
        clearTimeout(refreshTimer);
        refreshTimer = undefined;
        taiLaiTrang();
      } else if (topic === "sensors" && !refreshTimer) {
        refreshTimer = setTimeout(() => {
          refreshTimer = undefined;
          taiLaiTrang();
        }, 300);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(refreshTimer);
    };
  }, []);

  // Tải dữ liệu cảm biến
  useEffect(() => {
    let daHuy = false;
    const controller = new AbortController();

    async function taiDuLieuCamBien() {
      const thamSo = {
        page: trangHienTai,
        size: soDongMoiTrang,
        sortBy: "ID",
        order: thuTuSapXep,
        search: tuKhoaDaApDung,
        sensorType: loaiCamBienDaApDung === "TIME" ? "" : loaiCamBienDaApDung,
        from: thoiGianDaApDung?.from,
        to: thoiGianDaApDung?.to,
      };

      setDangTai(true);

      try {
        const query = buildQueryString(thamSo);
        const result = await requestApi(`/sensor-data?${query}`, { signal: controller.signal });

        if (daHuy) {
          return;
        }

        if (trangHienTai > 0 && trangHienTai >= result.totalPages) {
          setTrangHienTai(Math.max(0, result.totalPages - 1));
        } else {
          setTrangCamBien(result);
          setThongBaoLoi("");
        }
      } catch (error) {
        if (daHuy) {
          return;
        }

        setTrangCamBien(EMPTY_PAGE);
        if (error.status === 400) {
          setThongBaoLoi(error.message);
        } else {
          setThongBaoLoi(
            error.status
              ? "Không tải được dữ liệu cảm biến."
              : "Không thể kết nối máy chủ.",
          );
        }
      } finally {
        if (!daHuy) {
          setDangTai(false);
        }
      }
    }

    void taiDuLieuCamBien();

    return () => {
      daHuy = true;
      controller.abort();
    };
  }, [
    trangHienTai,
    tuKhoaDaApDung,
    loaiCamBienDaApDung,
    thoiGianDaApDung,
    soDongMoiTrang,
    thuTuSapXep,
    lanLamMoi,
  ]);

  const banGhiDau = trangCamBien.totalElements
    ? trangHienTai * soDongMoiTrang + 1
    : 0;

  const banGhiCuoi = trangCamBien.totalElements
    ? banGhiDau + trangCamBien.content.length - 1
    : 0;

  return (
    <section className="page data-page">
      <header className="page-header">
        <h1>Dữ liệu cảm biến</h1>
      </header>

      <section
        className="query-panel"
        aria-label="Bộ lọc dữ liệu cảm biến"
      >
        <div className="query-top-row">
          <form
            className="search-controls query-search-controls sensor-search-controls"
            onSubmit={xuLyTimKiem}
          >
            <label className="query-control">
              Tìm theo
              <select
                value={loaiCamBien}
                onChange={(event) => {
                  setLoaiCamBien(event.target.value);
                }}
              >
                <option value="">Tất cả</option>
                <option value="TEMPERATURE">Nhiệt độ</option>
                <option value="HUMIDITY">Độ ẩm</option>
                <option value="LIGHT">Ánh sáng</option>
                <option value="TIME">Thời gian</option>
              </select>
            </label>
            <label className="query-control query-search-input">
              Tìm kiếm
              <input
                value={tuKhoa}
                onChange={(event) => setTuKhoa(event.target.value)}
                placeholder={loaiCamBien === "TIME" ? "dd/MM/yyyy hoặc dd/MM/yyyy HH:mm:ss" : "Giá trị hoặc thời gian (dd/MM/yyyy)"}
              />
            </label>

            <button className="primary-button" type="submit">
              Tìm kiếm
            </button>
          </form>

          <div className="sort-controls">
            <label className="query-control query-order-control">
              Thứ tự
              <select
                value={thuTuSapXep}
                onChange={doiThuTuSapXep}
              >
                <option value="ASC">Tăng dần</option>
                <option value="DESC">Giảm dần</option>
              </select>
            </label>
          </div>
        </div>


        {loiTimKiem && <p className="query-error" role="alert">{loiTimKiem}</p>}
      </section>

      {thongBaoLoi && (
        <p className="query-error" role="alert">
          {thongBaoLoi}{" "}
          <button type="button" onClick={taiLaiTrang}>
            Thử lại
          </button>
        </p>
      )}

      <div className="table-summary">
      <p className="result-info">
        {dangTai && trangCamBien.content.length === 0
          ? "Đang tải..."
          : `Hiển thị ${banGhiDau}-${banGhiCuoi} trên tổng số ${trangCamBien.totalElements} bản ghi`}
      </p>

        <label className="page-size-control">
          Số dòng / trang
          <select
            value={soDongMoiTrang}
            onChange={(event) => {
              setSoDongMoiTrang(Number(event.target.value));
              setTrangHienTai(0);
            }}
          >
            {[5, 10, 15, 20].map((soDong) => (
              <option key={soDong} value={soDong}>{soDong}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-container" aria-busy={dangTai}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Loại cảm biến</th>
              <th>Giá trị</th>
              <th>Thời gian</th>
            </tr>
          </thead>

          <tbody>
            {trangCamBien.content.length > 0 ? (
              trangCamBien.content.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>
                    {SENSOR_NAMES[record.sensorType] || record.sensorType}
                  </td>
                  <td>
                    {formatValue(record.value)} {record.unit}
                  </td>
                  <td>{formatDateTime(record.recordedAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="empty-table-cell">
                  {dangTai ? "Đang tải..." : "Không tìm thấy dữ liệu."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={trangHienTai + 1}
        totalPages={trangCamBien.totalPages}
        onPageChange={(soTrang) => setTrangHienTai(soTrang - 1)}
        label="Phân trang dữ liệu cảm biến"
      />
    </section>
  );
}
