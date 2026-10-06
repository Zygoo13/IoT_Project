import { useEffect, useState } from "react";

import Pagination from "../components/Pagination";
import { buildQueryString, requestApi } from "../services/api";
import { onRealtime } from "../services/realtime";
import {
  DATE_TIME_FORMAT,
  formatDateTime,
  getDateRangeError,
  parseDateTime,
} from "../utils/dateTime";
import { formatValue } from "../utils/formatValue";

const PAGE_SIZE = 20;

const EMPTY_PAGE = {
  content: [],
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
};

const EMPTY_RANGE = {
  fromTime: "",
  toTime: "",
};

const SENSOR_NAMES = {
  TEMPERATURE: "Nhiệt độ",
  HUMIDITY: "Độ ẩm",
  LIGHT: "Ánh sáng",
};

export default function DataSensor() {
  const [trangHienTai, setTrangHienTai] = useState(0);
  const [trangCamBien, setTrangCamBien] = useState(EMPTY_PAGE);

  const [tuKhoa, setTuKhoa] = useState("");
  const [tuKhoaDaApDung, setTuKhoaDaApDung] = useState("");

  const [thuTuSapXep, setThuTuSapXep] = useState("DESC");

  const [khoangThoiGian, setKhoangThoiGian] = useState(EMPTY_RANGE);
  const [khoangDaApDung, setKhoangDaApDung] = useState(EMPTY_RANGE);

  const [loiBoLoc, setLoiBoLoc] = useState("");
  const [thongBaoLoi, setThongBaoLoi] = useState("");

  const [dangTai, setDangTai] = useState(true);
  const [lanLamMoi, setLanLamMoi] = useState(0);

  function taiLaiTrang() {
    setLanLamMoi((lanHienTai) => lanHienTai + 1);
  }

  function xuLyTimKiem(event) {
    event.preventDefault();

    setTuKhoaDaApDung(tuKhoa.trim());
    setTrangHienTai(0);
  }

  function doiThuTuSapXep(event) {
    setThuTuSapXep(event.target.value);
    setTrangHienTai(0);
  }

  // Kiểm tra khoảng thời gian
  function apDungKhoangThoiGian() {
    const loi = getDateRangeError(
      khoangThoiGian.fromTime,
      khoangThoiGian.toTime,
    );

    if (loi) {
      setLoiBoLoc(loi);
      return;
    }

    setLoiBoLoc("");
    setKhoangDaApDung({ ...khoangThoiGian });
    setTrangHienTai(0);
  }

  function xoaKhoangThoiGian() {
    setKhoangThoiGian(EMPTY_RANGE);
    setKhoangDaApDung(EMPTY_RANGE);
    setLoiBoLoc("");
    setTrangHienTai(0);
  }

  // Tải lại khi có dữ liệu realtime mới
  useEffect(() => {
    return onRealtime((topic) => {
      if (topic === "sensors" || topic === "connected") {
        taiLaiTrang();
      }
    });
  }, []);

  // Tải dữ liệu cảm biến
  useEffect(() => {
    let daHuy = false;

    async function taiDuLieuCamBien() {
      const thamSo = {
        page: trangHienTai,
        size: PAGE_SIZE,
        sortBy: "ID",
        order: thuTuSapXep,
        search: tuKhoaDaApDung,
        from: khoangDaApDung.fromTime
          ? parseDateTime(khoangDaApDung.fromTime)?.toISOString()
          : null,
        to: khoangDaApDung.toTime
          ? parseDateTime(khoangDaApDung.toTime)?.toISOString()
          : null,
      };

      setDangTai(true);
      setTrangCamBien(EMPTY_PAGE);

      try {
        const query = buildQueryString(thamSo);
        const result = await requestApi(`/sensor-data?${query}`);

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
    };
  }, [
    trangHienTai,
    tuKhoaDaApDung,
    khoangDaApDung,
    thuTuSapXep,
    lanLamMoi,
  ]);

  const banGhiDau = trangCamBien.totalElements
    ? trangHienTai * PAGE_SIZE + 1
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
            className="search-controls query-search-controls"
            onSubmit={xuLyTimKiem}
          >
            <label className="query-control query-search-input">
              Tìm kiếm
              <input
                value={tuKhoa}
                onChange={(event) => setTuKhoa(event.target.value)}
                placeholder="ID, loại cảm biến, giá trị hoặc thời gian"
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

        <div className="query-filter-row data-query-filter-row">
          <fieldset className="filter-group time-filter-group">
            <legend>Khoảng thời gian</legend>

            <div className="range-controls">
              <label>
                <span>Từ</span>
                <input
                  aria-label="Từ thời điểm"
                  placeholder={DATE_TIME_FORMAT}
                  value={khoangThoiGian.fromTime}
                  onChange={(event) =>
                    setKhoangThoiGian({
                      ...khoangThoiGian,
                      fromTime: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                <span>Đến</span>
                <input
                  aria-label="Đến thời điểm"
                  placeholder={DATE_TIME_FORMAT}
                  value={khoangThoiGian.toTime}
                  onChange={(event) =>
                    setKhoangThoiGian({
                      ...khoangThoiGian,
                      toTime: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          </fieldset>

          <div className="filter-actions query-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={xoaKhoangThoiGian}
            >
              Xóa lọc
            </button>

            <button
              className="primary-button"
              type="button"
              onClick={apDungKhoangThoiGian}
            >
              Áp dụng
            </button>
          </div>
        </div>

        {loiBoLoc && (
          <p className="query-error" role="alert">
            {loiBoLoc}
          </p>
        )}
      </section>

      {thongBaoLoi && (
        <p className="query-error" role="alert">
          {thongBaoLoi}{" "}
          <button type="button" onClick={taiLaiTrang}>
            Thử lại
          </button>
        </p>
      )}

      <p className="result-info">
        {dangTai
          ? "Đang tải..."
          : `Hiển thị ${banGhiDau}-${banGhiCuoi} trên tổng số ${trangCamBien.totalElements} bản ghi`}
      </p>

      <div className="table-container">
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