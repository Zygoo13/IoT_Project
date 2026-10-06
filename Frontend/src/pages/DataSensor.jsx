import { useEffect, useState } from "react";
import Pagination from "../components/Pagination";
import { api, query } from "../services/api";
import { onRealtime } from "../services/realtime";
import { DATE_TIME_FORMAT, formatDateTime, parseDateTime } from "../utils/dateTime";

const emptyPage = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };
const emptyRange = { fromTime: "", toTime: "" };
const sensorNames = { TEMPERATURE: "Nhiệt độ", HUMIDITY: "Độ ẩm", LIGHT: "Ánh sáng" };

export default function DataSensor() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState(emptyPage);
  const [searchField, setSearchField] = useState("ID");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(null);
  const [sortBy, setSortBy] = useState("TIME");
  const [order, setOrder] = useState("DESC");
  const [rangeInput, setRangeInput] = useState(emptyRange);
  const [range, setRange] = useState(emptyRange);
  const [filterError, setFilterError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => onRealtime((topic) => {
    if (topic === "sensors" || topic === "connected") setReload((value) => value + 1);
  }), []);

  useEffect(() => {
    let cancelled = false;
    const params = {
      page, size: 20, sortBy, order,
      ...(search ? { searchField: search.field, search: search.value } : {}),
      ...(range.fromTime ? { from: parseDateTime(range.fromTime)?.toISOString() } : {}),
      ...(range.toTime ? { to: parseDateTime(range.toTime)?.toISOString() } : {}),
    };
    setLoading(true);
    setData(emptyPage);
    api(`/sensor-data?${query(params)}`).then((result) => {
      if (!cancelled) {
        if (page > 0 && page >= result.totalPages) setPage(Math.max(0, result.totalPages - 1));
        else { setData(result); setError(""); }
      }
    }).catch((problem) => {
      if (!cancelled) setError(problem.status === 400 ? problem.message :
        problem.status ? "Không tải được dữ liệu cảm biến." : "Không thể kết nối Backend.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, search, range, sortBy, order, reload]);

  function handleSearch(event) {
    event.preventDefault();
    const value = searchInput.trim();
    setSearch(value ? { field: searchField, value } : null);
    setPage(0);
  }

  function applyRange() {
    const from = rangeInput.fromTime ? parseDateTime(rangeInput.fromTime) : null;
    const to = rangeInput.toTime ? parseDateTime(rangeInput.toTime) : null;
    if ((rangeInput.fromTime && !from) || (rangeInput.toTime && !to)) {
      setFilterError(`Nhập thời gian theo định dạng ${DATE_TIME_FORMAT}.`); return;
    }
    if (from && to && from > to) {
      setFilterError("Thời gian bắt đầu phải trước hoặc bằng thời gian kết thúc."); return;
    }
    setFilterError(""); setRange({ ...rangeInput }); setPage(0);
  }

  function clearRange() {
    setRangeInput(emptyRange); setRange(emptyRange); setFilterError(""); setPage(0);
  }

  const first = data.totalElements ? page * 20 + 1 : 0;
  const last = data.totalElements ? first + data.content.length - 1 : 0;

  return (
    <section className="page data-page">
      <header className="page-header"><h1>Dữ liệu cảm biến</h1><p>Tra cứu các lần đo đã lưu.</p></header>
      <section className="query-panel" aria-label="Bộ lọc dữ liệu cảm biến">
        <div className="query-top-row">
          <form className="search-controls query-search-controls" onSubmit={handleSearch}>
            <label className="query-control query-search-field">Tìm theo
              <select value={searchField} onChange={(event) => setSearchField(event.target.value)}>
                <option value="ID">ID</option><option value="SENSOR_TYPE">Loại cảm biến</option>
                <option value="VALUE">Giá trị</option><option value="TIME">Thời gian</option>
              </select>
            </label>
            <label className="query-control query-search-input">Từ khóa
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)}
                placeholder={searchField === "TIME" ? "Ngày UTC yyyy-MM-dd hoặc ISO 8601" :
                  searchField === "SENSOR_TYPE" ? "TEMPERATURE / HUMIDITY / LIGHT" : "Nhập nội dung cần tìm"} />
            </label>
            <button className="primary-button" type="submit">Tìm kiếm</button>
          </form>
          <div className="sort-controls">
            <label className="query-control">Sắp xếp theo
              <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(0); }}>
                <option value="ID">ID</option><option value="SENSOR_TYPE">Loại cảm biến</option>
                <option value="VALUE">Giá trị</option><option value="TIME">Thời gian</option>
              </select>
            </label>
            <label className="query-control query-order-control">Thứ tự
              <select value={order} onChange={(event) => { setOrder(event.target.value); setPage(0); }}>
                <option value="ASC">Tăng dần</option><option value="DESC">Giảm dần</option>
              </select>
            </label>
          </div>
        </div>
        <div className="query-filter-row data-query-filter-row">
          <fieldset className="filter-group time-filter-group"><legend>Khoảng thời gian</legend>
            <div className="range-controls">
              <label><span>Từ</span><input aria-label="Từ thời điểm" placeholder={DATE_TIME_FORMAT}
                value={rangeInput.fromTime} onChange={(event) => setRangeInput({ ...rangeInput, fromTime: event.target.value })} /></label>
              <label><span>Đến</span><input aria-label="Đến thời điểm" placeholder={DATE_TIME_FORMAT}
                value={rangeInput.toTime} onChange={(event) => setRangeInput({ ...rangeInput, toTime: event.target.value })} /></label>
            </div>
          </fieldset>
          <div className="filter-actions query-actions">
            <button className="secondary-button" type="button" onClick={clearRange}>Xóa lọc</button>
            <button className="primary-button" type="button" onClick={applyRange}>Áp dụng</button>
          </div>
        </div>
        {filterError && <p className="query-error" role="alert">{filterError}</p>}
      </section>
      {error && <p className="query-error" role="alert">{error} <button type="button" onClick={() => setReload((value) => value + 1)}>Thử lại</button></p>}
      <p className="result-info">{loading ? "Đang tải..." : `Hiển thị ${first}-${last} trên tổng số ${data.totalElements} bản ghi`}</p>
      <div className="table-container"><table className="data-table">
        <thead><tr><th>ID</th><th>Loại cảm biến</th><th>Giá trị</th><th>Thời gian</th></tr></thead>
        <tbody>{data.content.length ? data.content.map((record) => <tr key={record.id}>
          <td>{record.id}</td><td>{sensorNames[record.sensorType] || record.sensorType}</td>
          <td>{record.value} {record.unit}</td><td>{formatDateTime(record.recordedAt)}</td>
        </tr>) : <tr><td colSpan="4" className="empty-table-cell">{loading ? "Đang tải..." : "Không tìm thấy dữ liệu."}</td></tr>}</tbody>
      </table></div>
      <Pagination currentPage={page + 1} totalPages={data.totalPages} onPageChange={(next) => setPage(next - 1)} label="Phân trang dữ liệu cảm biến" />
    </section>
  );
}
