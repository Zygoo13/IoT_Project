import { useState } from "react";
import Pagination from "../components/Pagination";
import { mockSensorData } from "../data/mockData";
import { DATE_TIME_FORMAT, formatDateTime, parseDateTime } from "../utils/dateTime";

const PAGE_SIZE = 20;

const initialFilters = {
  fromTime: "",
  toTime: "",
};

function DataSensor() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchField, setSearchField] = useState("id");
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterInputs, setFilterInputs] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [filterError, setFilterError] = useState("");

  function handleSearch(event) {
    event.preventDefault();
    setSearchValue(searchInput.trim());
    setCurrentPage(1);
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilterInputs((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function handleApplyFilters() {
    const fromDate = filterInputs.fromTime ? parseDateTime(filterInputs.fromTime) : null;
    const toDate = filterInputs.toTime ? parseDateTime(filterInputs.toTime) : null;

    if ((filterInputs.fromTime && !fromDate) || (filterInputs.toTime && !toDate)) {
      setFilterError(`Nhập thời gian theo định dạng ${DATE_TIME_FORMAT}.`);
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      setFilterError("Thời gian bắt đầu phải trước hoặc bằng thời gian kết thúc.");
      return;
    }

    setFilterError("");
    setFilters(filterInputs);
    setCurrentPage(1);
  }

  function handleResetFilters() {
    setFilterInputs(initialFilters);
    setFilters(initialFilters);
    setFilterError("");
    setCurrentPage(1);
  }

  const fromDate = filters.fromTime ? parseDateTime(filters.fromTime) : null;
  const toDate = filters.toTime ? parseDateTime(filters.toTime) : null;

  let result = [...mockSensorData];

  if (searchValue) {
    const valueToFind = searchValue.toLowerCase();

    result = result.filter((record) => {
      if (searchField === "time") {
        return formatDateTime(record.recordedAt).toLowerCase().includes(valueToFind);
      }

      return String(record[searchField]).toLowerCase().includes(valueToFind);
    });
  }

  result = result.filter((record) => {
    if (fromDate && new Date(record.recordedAt) < fromDate) {
      return false;
    }

    if (toDate && new Date(record.recordedAt) > toDate) {
      return false;
    }

    return true;
  });

  result.sort((firstRecord, secondRecord) => {
    let comparison;

    if (sortField === "time") {
      comparison = new Date(firstRecord.recordedAt) - new Date(secondRecord.recordedAt);
    } else if (sortField === "sensorName") {
      comparison = firstRecord.sensorName.localeCompare(secondRecord.sensorName);
    } else {
      comparison = firstRecord[sortField] - secondRecord[sortField];
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(result.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRecords = result.slice(startIndex, startIndex + PAGE_SIZE);
  const firstItem = result.length === 0 ? 0 : startIndex + 1;
  const lastItem = Math.min(startIndex + PAGE_SIZE, result.length);

  return (
    <section className="page data-page">
      <header className="page-header">
        <h1>Dữ liệu cảm biến</h1>
        <p>Tra cứu các lần đo đã lưu.</p>
      </header>

      <section className="query-panel" aria-label="Bộ lọc dữ liệu cảm biến">
        <div className="query-top-row">
          <form className="search-controls query-search-controls" onSubmit={handleSearch}>
            <label className="query-control query-search-field">
              Tìm theo
              <select
                value={searchField}
                onChange={(event) => setSearchField(event.target.value)}
              >
                <option value="id">ID</option>
                <option value="sensorName">Loại cảm biến</option>
                <option value="value">Giá trị</option>
                <option value="time">Thời gian</option>
              </select>
            </label>
            <label className="query-control query-search-input">
              Từ khóa
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Nhập nội dung cần tìm"
              />
            </label>
            <button className="primary-button" type="submit">
              Tìm kiếm
            </button>
          </form>

          <div className="sort-controls">
            <label className="query-control">
              Sắp xếp theo
              <select
                value={sortField}
                onChange={(event) => {
                  setSortField(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="id">ID</option>
                <option value="sensorName">Loại cảm biến</option>
                <option value="value">Giá trị</option>
                <option value="time">Thời gian</option>
              </select>
            </label>
            <label className="query-control query-order-control">
              Thứ tự
              <select
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
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
                <input name="fromTime" aria-label="Từ thời điểm" type="text" placeholder={DATE_TIME_FORMAT} value={filterInputs.fromTime} onChange={handleFilterChange} />
              </label>
              <label>
                <span>Đến</span>
                <input name="toTime" aria-label="Đến thời điểm" type="text" placeholder={DATE_TIME_FORMAT} value={filterInputs.toTime} onChange={handleFilterChange} />
              </label>
            </div>
          </fieldset>

          <div className="filter-actions query-actions">
            <button className="secondary-button" type="button" onClick={handleResetFilters}>
              Xóa lọc
            </button>
            <button className="primary-button" type="button" onClick={handleApplyFilters}>
              Áp dụng
            </button>
          </div>
        </div>
        {filterError && <p className="query-error" role="alert">{filterError}</p>}
      </section>

      <p className="result-info">
        Hiển thị {firstItem}-{lastItem} trên tổng số {result.length} bản ghi
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
            {pageRecords.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-table-cell">
                  Không tìm thấy dữ liệu.
                </td>
              </tr>
            ) : (
              pageRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>{record.sensorName}</td>
                  <td>{record.value} {record.unit}</td>
                  <td>{formatDateTime(record.recordedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        label="Phân trang dữ liệu cảm biến"
      />
    </section>
  );
}

export default DataSensor;
