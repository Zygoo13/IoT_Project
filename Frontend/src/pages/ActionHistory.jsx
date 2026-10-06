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

const PAGE_SIZE = 20;

const EMPTY_PAGE = {
  content: [],
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
};

const EMPTY_FILTERS = {
  device: "",
  action: "",
  status: "",
  fromTime: "",
  toTime: "",
};

export default function ActionHistory() {
  const [trangHienTai, setTrangHienTai] = useState(0);
  const [trangLichSu, setTrangLichSu] = useState(EMPTY_PAGE);

  const [tuKhoa, setTuKhoa] = useState("");
  const [tuKhoaDaApDung, setTuKhoaDaApDung] = useState("");

  const [thuTuSapXep, setThuTuSapXep] = useState("DESC");

  const [boLoc, setBoLoc] = useState(EMPTY_FILTERS);
  const [boLocDaApDung, setBoLocDaApDung] = useState(EMPTY_FILTERS);

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

  // Kiểm tra và áp dụng bộ lọc
  function apDungBoLoc() {
    const loi = getDateRangeError(boLoc.fromTime, boLoc.toTime);

    if (loi) {
      setLoiBoLoc(loi);
      return;
    }

    setLoiBoLoc("");
    setBoLocDaApDung({ ...boLoc });
    setTrangHienTai(0);
  }

  function xoaBoLoc() {
    setBoLoc(EMPTY_FILTERS);
    setBoLocDaApDung(EMPTY_FILTERS);
    setLoiBoLoc("");
    setTrangHienTai(0);
  }

  // Tải lại khi có dữ liệu realtime mới
  useEffect(() => {
    return onRealtime((topic) => {
      if (
        topic === "connected" ||
        topic === "devices" ||
        topic === "notifications"
      ) {
        taiLaiTrang();
      }
    });
  }, []);

  // Tải lịch sử điều khiển
  useEffect(() => {
    let daHuy = false;

    async function taiLichSuDieuKhien() {
      const thamSo = {
        page: trangHienTai,
        size: PAGE_SIZE,
        sortBy: "ID",
        order: thuTuSapXep,
        search: tuKhoaDaApDung,
        device: boLocDaApDung.device,
        action: boLocDaApDung.action,
        status: boLocDaApDung.status,
        from: boLocDaApDung.fromTime
          ? parseDateTime(boLocDaApDung.fromTime)?.toISOString()
          : null,
        to: boLocDaApDung.toTime
          ? parseDateTime(boLocDaApDung.toTime)?.toISOString()
          : null,
      };

      setDangTai(true);
      setTrangLichSu(EMPTY_PAGE);

      try {
        const query = buildQueryString(thamSo);
        const result = await requestApi(`/action-history?${query}`);

        if (daHuy) {
          return;
        }

        if (trangHienTai > 0 && trangHienTai >= result.totalPages) {
          setTrangHienTai(Math.max(0, result.totalPages - 1));
        } else {
          setTrangLichSu(result);
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
              ? "Không tải được lịch sử điều khiển."
              : "Không thể kết nối máy chủ.",
          );
        }
      } finally {
        if (!daHuy) {
          setDangTai(false);
        }
      }
    }

    void taiLichSuDieuKhien();

    return () => {
      daHuy = true;
    };
  }, [
    trangHienTai,
    tuKhoaDaApDung,
    boLocDaApDung,
    thuTuSapXep,
    lanLamMoi,
  ]);

  const banGhiDau = trangLichSu.totalElements
    ? trangHienTai * PAGE_SIZE + 1
    : 0;

  const banGhiCuoi = trangLichSu.totalElements
    ? banGhiDau + trangLichSu.content.length - 1
    : 0;

  return (
    <section className="page history-page">
      <header className="page-header">
        <h1>Lịch sử điều khiển</h1>
      </header>

      <section
        className="query-panel"
        aria-label="Bộ lọc lịch sử điều khiển"
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
                placeholder="ID, thiết bị, lệnh, trạng thái hoặc thời gian"
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

        <div className="query-filter-row history-query-filter-row">
          <label className="query-control">
            Thiết bị
            <select
              value={boLoc.device}
              onChange={(event) =>
                setBoLoc({
                  ...boLoc,
                  device: event.target.value,
                })
              }
            >
              <option value="">Tất cả</option>
              <option value="LED1">LED1</option>
              <option value="LED2">LED2</option>
            </select>
          </label>

          <label className="query-control">
            Lệnh
            <select
              value={boLoc.action}
              onChange={(event) =>
                setBoLoc({
                  ...boLoc,
                  action: event.target.value,
                })
              }
            >
              <option value="">Tất cả</option>
              <option value="ON">Bật</option>
              <option value="OFF">Tắt</option>
            </select>
          </label>

          <label className="query-control">
            Trạng thái
            <select
              value={boLoc.status}
              onChange={(event) =>
                setBoLoc({
                  ...boLoc,
                  status: event.target.value,
                })
              }
            >
              <option value="">Tất cả</option>
              <option value="ON">Bật</option>
              <option value="OFF">Tắt</option>
            </select>
          </label>

          <label className="query-control history-time-control">
            Từ thời điểm
            <input
              placeholder={DATE_TIME_FORMAT}
              value={boLoc.fromTime}
              onChange={(event) =>
                setBoLoc({
                  ...boLoc,
                  fromTime: event.target.value,
                })
              }
            />
          </label>

          <label className="query-control history-time-control">
            Đến thời điểm
            <input
              placeholder={DATE_TIME_FORMAT}
              value={boLoc.toTime}
              onChange={(event) =>
                setBoLoc({
                  ...boLoc,
                  toTime: event.target.value,
                })
              }
            />
          </label>

          <div className="filter-actions query-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={xoaBoLoc}
            >
              Xóa lọc
            </button>

            <button
              className="primary-button"
              type="button"
              onClick={apDungBoLoc}
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
          : `Hiển thị ${banGhiDau}-${banGhiCuoi} trên tổng số ${trangLichSu.totalElements} bản ghi`}
      </p>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Thiết bị</th>
              <th>Lệnh</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
            </tr>
          </thead>

          <tbody>
            {trangLichSu.content.length > 0 ? (
              trangLichSu.content.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>{record.deviceCode}</td>

                  <td>
                    <span
                      className={`status-badge ${record.status === "ON" ? "is-on" : "is-off"
                        }`}
                    >
                      {record.status === "ON" ? "BẬT" : "TẮT"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${record.status === "ON" ? "is-on" : "is-off"
                        }`}
                    >
                      {record.status === "ON" ? "BẬT" : "TẮT"}
                    </span>
                  </td>

                  <td>{formatDateTime(record.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-table-cell">
                  {dangTai ? "Đang tải..." : "Không tìm thấy dữ liệu."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={trangHienTai + 1}
        totalPages={trangLichSu.totalPages}
        onPageChange={(soTrang) => setTrangHienTai(soTrang - 1)}
        label="Phân trang lịch sử điều khiển"
      />
    </section>
  );
}