import { useEffect, useState } from "react";
import Pagination from "../components/Pagination";
import { api, query } from "../services/api";
import { onRealtime } from "../services/realtime";
import { DATE_TIME_FORMAT, formatDateTime, parseDateTime } from "../utils/dateTime";

const emptyPage = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };
const emptyFilters = { device: "", action: "", status: "", fromTime: "", toTime: "" };
const deliveryLabels = { PENDING: "Đang chờ", TIMEOUT: "Không phản hồi", CONFIRMED: "Đã xác nhận" };

export default function ActionHistory() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState(emptyPage);
  const [searchField, setSearchField] = useState("ID");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(null);
  const [sortBy, setSortBy] = useState("TIME");
  const [order, setOrder] = useState("DESC");
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [filterError, setFilterError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => onRealtime((topic) => {
    if (["connected", "devices", "notifications"].includes(topic)) setReload((value) => value + 1);
  }), []);

  useEffect(() => {
    let cancelled = false;
    const params = {
      page, size: 20, sortBy, order,
      ...(search ? { searchField: search.field, search: search.value } : {}),
      device: filters.device, action: filters.action, status: filters.status,
      ...(filters.fromTime ? { from: parseDateTime(filters.fromTime)?.toISOString() } : {}),
      ...(filters.toTime ? { to: parseDateTime(filters.toTime)?.toISOString() } : {}),
    };
    setLoading(true);
    setData(emptyPage);
    api(`/action-history?${query(params)}`).then((result) => {
      if (!cancelled) {
        if (page > 0 && page >= result.totalPages) setPage(Math.max(0, result.totalPages - 1));
        else { setData(result); setError(""); }
      }
    }).catch((problem) => {
      if (!cancelled) setError(problem.status === 400 ? problem.message :
        problem.status ? "Không tải được lịch sử điều khiển." : "Không thể kết nối Backend.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, search, filters, sortBy, order, reload]);

  function handleSearch(event) {
    event.preventDefault();
    const value = searchInput.trim();
    setSearch(value ? { field: searchField, value } : null); setPage(0);
  }

  function applyFilters() {
    const from = filterInput.fromTime ? parseDateTime(filterInput.fromTime) : null;
    const to = filterInput.toTime ? parseDateTime(filterInput.toTime) : null;
    if ((filterInput.fromTime && !from) || (filterInput.toTime && !to)) {
      setFilterError(`Nhập thời gian theo định dạng ${DATE_TIME_FORMAT}.`); return;
    }
    if (from && to && from > to) {
      setFilterError("Thời gian bắt đầu phải trước hoặc bằng thời gian kết thúc."); return;
    }
    setFilterError(""); setFilters({ ...filterInput }); setPage(0);
  }

  function clearFilters() {
    setFilterInput(emptyFilters); setFilters(emptyFilters); setFilterError(""); setPage(0);
  }

  const first = data.totalElements ? page * 20 + 1 : 0;
  const last = data.totalElements ? first + data.content.length - 1 : 0;

  return (
    <section className="page history-page">
      <header className="page-header"><h1>Lịch sử điều khiển</h1><p>Xem các lệnh đã gửi và trạng thái thiết bị được ghi nhận.</p></header>
      <section className="query-panel" aria-label="Bộ lọc lịch sử điều khiển">
        <div className="query-top-row">
          <form className="search-controls query-search-controls" onSubmit={handleSearch}>
            <label className="query-control query-search-field">Tìm theo
              <select value={searchField} onChange={(event) => setSearchField(event.target.value)}>
                <option value="ID">ID</option><option value="DEVICE">Thiết bị</option>
              </select>
            </label>
            <label className="query-control query-search-input">Từ khóa
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Nhập nội dung cần tìm" />
            </label>
            <button className="primary-button" type="submit">Tìm kiếm</button>
          </form>
          <div className="sort-controls">
            <label className="query-control">Sắp xếp theo
              <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(0); }}>
                <option value="ID">ID</option><option value="DEVICE">Thiết bị</option>
                <option value="ACTION">Lệnh</option><option value="STATUS">Trạng thái</option>
                <option value="TIME">Thời gian</option>
              </select>
            </label>
            <label className="query-control query-order-control">Thứ tự
              <select value={order} onChange={(event) => { setOrder(event.target.value); setPage(0); }}>
                <option value="ASC">Tăng dần</option><option value="DESC">Giảm dần</option>
              </select>
            </label>
          </div>
        </div>
        <div className="query-filter-row history-query-filter-row">
          <label className="query-control">Thiết bị
            <select value={filterInput.device} onChange={(event) => setFilterInput({ ...filterInput, device: event.target.value })}>
              <option value="">Tất cả</option><option value="LED1">LED1</option><option value="LED2">LED2</option>
            </select>
          </label>
          <label className="query-control">Lệnh
            <select value={filterInput.action} onChange={(event) => setFilterInput({ ...filterInput, action: event.target.value })}>
              <option value="">Tất cả</option><option value="ON">Bật</option><option value="OFF">Tắt</option>
            </select>
          </label>
          <label className="query-control">Trạng thái
            <select value={filterInput.status} onChange={(event) => setFilterInput({ ...filterInput, status: event.target.value })}>
              <option value="">Tất cả</option><option value="ON">Bật</option><option value="OFF">Tắt</option>
            </select>
          </label>
          <label className="query-control history-time-control">Từ thời điểm
            <input placeholder={DATE_TIME_FORMAT} value={filterInput.fromTime} onChange={(event) => setFilterInput({ ...filterInput, fromTime: event.target.value })} />
          </label>
          <label className="query-control history-time-control">Đến thời điểm
            <input placeholder={DATE_TIME_FORMAT} value={filterInput.toTime} onChange={(event) => setFilterInput({ ...filterInput, toTime: event.target.value })} />
          </label>
          <div className="filter-actions query-actions">
            <button className="secondary-button" type="button" onClick={clearFilters}>Xóa lọc</button>
            <button className="primary-button" type="button" onClick={applyFilters}>Áp dụng</button>
          </div>
        </div>
        {filterError && <p className="query-error" role="alert">{filterError}</p>}
      </section>
      {error && <p className="query-error" role="alert">{error} <button type="button" onClick={() => setReload((value) => value + 1)}>Thử lại</button></p>}
      <p className="result-info">{loading ? "Đang tải..." : `Hiển thị ${first}-${last} trên tổng số ${data.totalElements} bản ghi`}</p>
      <div className="table-container"><table className="data-table">
        <thead><tr><th>ID</th><th>Thiết bị</th><th>Lệnh</th><th>Trạng thái</th><th>Thời gian</th></tr></thead>
        <tbody>{data.content.length ? data.content.map((record) => <tr key={record.id}>
          <td>{record.id}</td><td>{record.deviceCode}</td>
          <td><span className={`action-badge ${record.action === "ON" ? "is-on" : "is-off"}`}>{record.action === "ON" ? "BẬT" : "TẮT"}</span></td>
          <td><span className={`status-badge ${record.status === "ON" ? "is-on" : "is-off"}`}>{record.status === "ON" ? "BẬT" : "TẮT"}</span>
            <small className="delivery-state">{deliveryLabels[record.deliveryState]}{record.confirmedAt ? ` · ${formatDateTime(record.confirmedAt)}` : ""}</small>
          </td>
          <td>{formatDateTime(record.createdAt)}</td>
        </tr>) : <tr><td colSpan="5" className="empty-table-cell">{loading ? "Đang tải..." : "Không tìm thấy dữ liệu."}</td></tr>}</tbody>
      </table></div>
      <Pagination currentPage={page + 1} totalPages={data.totalPages} onPageChange={(next) => setPage(next - 1)} label="Phân trang lịch sử điều khiển" />
    </section>
  );
}
