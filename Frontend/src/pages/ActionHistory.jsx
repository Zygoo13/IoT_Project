import { useEffect, useState } from "react";

import Pagination from "../components/Pagination";
import { buildQueryString, requestApi } from "../services/api";
import { onRealtime } from "../services/realtime";
import { formatDateTime, parseSearchTimeRange } from "../utils/dateTime";

const PAGE_SIZE = 5;

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
};

export default function ActionHistory() {
  const [trangHienTai, setTrangHienTai] = useState(0);
  const [trangLichSu, setTrangLichSu] = useState(EMPTY_PAGE);
  const [soDongMoiTrang, setSoDongMoiTrang] = useState(PAGE_SIZE);

  const [tuKhoa, setTuKhoa] = useState("");
  const [thoiGianDaApDung, setThoiGianDaApDung] = useState(null);
  const [loiTimKiem, setLoiTimKiem] = useState("");

  const [thuTuSapXep, setThuTuSapXep] = useState("DESC");

  const [boLoc, setBoLoc] = useState(EMPTY_FILTERS);

  const [thongBaoLoi, setThongBaoLoi] = useState("");

  const [dangTai, setDangTai] = useState(true);
  const [lanLamMoi, setLanLamMoi] = useState(0);

  function taiLaiTrang() {
    setLanLamMoi((lanHienTai) => lanHienTai + 1);
  }

  function xuLyTimKiem(event) {
    event.preventDefault();

    try {
      setThoiGianDaApDung(parseSearchTimeRange(tuKhoa));
    } catch (error) {
      setLoiTimKiem(error.message);
      return;
    }
    setLoiTimKiem("");
    setTrangHienTai(0);
  }

  function doiThuTuSapXep(event) {
    setThuTuSapXep(event.target.value);
    setTrangHienTai(0);
  }

  function doiBoLoc(tenTruong, giaTri) {
    setBoLoc((boLocHienTai) => ({ ...boLocHienTai, [tenTruong]: giaTri }));
    setTrangHienTai(0);
  }

  function xoaBoLoc() {
    setTuKhoa("");
    setThoiGianDaApDung(null);
    setLoiTimKiem("");
    setBoLoc(EMPTY_FILTERS);
    setTrangHienTai(0);
  }

  // Gom phản hồi gần nhau, giữ bảng trong lúc tải lại.
  useEffect(() => {
    let refreshTimer;
    const unsubscribe = onRealtime((topic) => {
      if (topic === "connected") {
        clearTimeout(refreshTimer);
        refreshTimer = undefined;
        taiLaiTrang();
      } else if ((topic === "devices" || topic === "notifications") && !refreshTimer) {
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

  // Tải lịch sử điều khiển
  useEffect(() => {
    let daHuy = false;
    const controller = new AbortController();

    async function taiLichSuDieuKhien() {
      const thamSo = {
        page: trangHienTai,
        size: soDongMoiTrang,
        sortBy: "ID",
        order: thuTuSapXep,
        from: thoiGianDaApDung?.from,
        to: thoiGianDaApDung?.to,
        device: boLoc.device,
        action: boLoc.action,
        status: boLoc.status,
      };

      setDangTai(true);

      try {
        const query = buildQueryString(thamSo);
        const result = await requestApi(`/action-history?${query}`, { signal: controller.signal });

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

        setTrangLichSu(EMPTY_PAGE);
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
      controller.abort();
    };
  }, [
    trangHienTai,
    thoiGianDaApDung,
    soDongMoiTrang,
    boLoc,
    thuTuSapXep,
    lanLamMoi,
  ]);

  const banGhiDau = trangLichSu.totalElements
    ? trangHienTai * soDongMoiTrang + 1
    : 0;

  const banGhiCuoi = trangLichSu.totalElements
    ? banGhiDau + trangLichSu.content.length - 1
    : 0;

  return (
    <section className="page history-page">
      <header className="page-header">
        <h1>Lịch sử điều khiển</h1>
      </header>

      <section className="query-panel" aria-label="Bộ lọc lịch sử điều khiển">
        <div className="query-top-row">
          <form className="search-controls query-search-controls" onSubmit={xuLyTimKiem}>
            <label className="query-control">
              Tìm kiếm theo thời gian
              <input
                value={tuKhoa}
                onChange={(event) => setTuKhoa(event.target.value)}
                placeholder="dd/MM/yyyy hoặc dd/MM/yyyy HH:mm:ss"
                aria-invalid={Boolean(loiTimKiem)}
              />
            </label>
            <button className="primary-button" type="submit">Tìm kiếm</button>
          </form>
          <div className="sort-controls">
            <label className="query-control">
              Thứ tự
              <select value={thuTuSapXep} onChange={doiThuTuSapXep}>
                <option value="ASC">Tăng dần</option>
                <option value="DESC">Giảm dần</option>
              </select>
            </label>
          </div>
        </div>
        <div className="history-filter-controls">
          <label className="query-control">
            Thiết bị
            <select value={boLoc.device} onChange={(event) => doiBoLoc("device", event.target.value)}>
              <option value="">Tất cả</option>
              <option value="LED1">LED1</option>
              <option value="LED2">LED2</option>
            </select>
          </label>
          <label className="query-control">
            Lệnh
            <select value={boLoc.action} onChange={(event) => doiBoLoc("action", event.target.value)}>
              <option value="">Tất cả</option>
              <option value="ON">Bật</option>
              <option value="OFF">Tắt</option>
            </select>
          </label>
          <label className="query-control">
            Trạng thái
            <select value={boLoc.status} onChange={(event) => doiBoLoc("status", event.target.value)}>
              <option value="">Tất cả</option>
              <option value="PROCESSING">Processing</option>
              <option value="ON">Bật</option>
              <option value="OFF">Tắt</option>
            </select>
          </label>
          <button className="secondary-button clear-filter-button" type="button" onClick={xoaBoLoc}>
            Xóa lọc
          </button>
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
          {dangTai && trangLichSu.content.length === 0
            ? "Đang tải..."
            : `Hiển thị ${banGhiDau}-${banGhiCuoi} trên tổng số ${trangLichSu.totalElements} bản ghi`}
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
              <th>Thiết bị</th>
              <th>Người thực hiện</th>
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
                  <td className="history-username">{record.username || "—"}</td>

                  <td>
                    <span
                      className={`action-badge ${record.action === "ON" ? "is-on" : "is-off"
                        }`}
                    >
                      {record.action === "ON" ? "BẬT" : "TẮT"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${record.deliveryState === "PENDING" ? "is-processing" : record.status === "ON" ? "is-on" : "is-off"
                        }`}
                    >
                      {record.deliveryState === "PENDING" ? "Processing" : record.status === "ON" ? "BẬT" : "TẮT"}
                    </span>
                  </td>

                  <td>{formatDateTime(record.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-table-cell">
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
