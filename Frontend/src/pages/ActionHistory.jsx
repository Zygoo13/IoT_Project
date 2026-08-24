import { useState } from "react";
import Pagination from "../components/Pagination";
import { devices, mockActionHistory } from "../data/mockData";
import { DATE_TIME_FORMAT, formatDateTime, parseDateTime } from "../utils/dateTime";

const PAGE_SIZE = 20;

const initialFilters = {
  device: "",
  action: "",
  status: "",
  fromTime: "",
  toTime: "",
};

function ActionHistory() {
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
      setFilterError(`Use the format ${DATE_TIME_FORMAT}.`);
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      setFilterError("From time must be earlier than or equal to To time.");
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

  let result = [...mockActionHistory];

  if (searchValue) {
    const valueToFind = searchValue.toLowerCase();

    result = result.filter((record) =>
      String(record[searchField]).toLowerCase().includes(valueToFind),
    );
  }

  result = result.filter((record) => {
    if (filters.device && record.device !== filters.device) {
      return false;
    }

    if (filters.action && record.action !== filters.action) {
      return false;
    }

    if (filters.status && record.status !== filters.status) {
      return false;
    }

    if (fromDate && new Date(record.createdAt) < fromDate) {
      return false;
    }

    if (toDate && new Date(record.createdAt) > toDate) {
      return false;
    }

    return true;
  });

  result.sort((firstRecord, secondRecord) => {
    let comparison;

    if (sortField === "id") {
      comparison = firstRecord.id - secondRecord.id;
    } else if (sortField === "time") {
      comparison = new Date(firstRecord.createdAt) - new Date(secondRecord.createdAt);
    } else {
      comparison = firstRecord[sortField].localeCompare(secondRecord[sortField]);
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(result.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRecords = result.slice(startIndex, startIndex + PAGE_SIZE);
  const firstItem = result.length === 0 ? 0 : startIndex + 1;
  const lastItem = Math.min(startIndex + PAGE_SIZE, result.length);

  return (
    <section className="page history-page">
      <header className="page-header">
        <h1>Action History</h1>
        <p>Review requested actions and their recorded device status.</p>
      </header>

      <section className="query-panel" aria-label="Action History query controls">
        <div className="query-top-row">
          <form className="search-controls query-search-controls" onSubmit={handleSearch}>
            <label className="query-control query-search-field">
              Search field
              <select
                value={searchField}
                onChange={(event) => setSearchField(event.target.value)}
              >
                <option value="id">ID</option>
                <option value="device">Device</option>
              </select>
            </label>
            <label className="query-control query-search-input">
              Search
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search value"
              />
            </label>
            <button className="primary-button" type="submit">
              Search
            </button>
          </form>

          <div className="sort-controls">
            <label className="query-control">
              Sort by
              <select
                value={sortField}
                onChange={(event) => {
                  setSortField(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="id">ID</option>
                <option value="device">Device</option>
                <option value="action">Action</option>
                <option value="status">Status</option>
                <option value="time">Time</option>
              </select>
            </label>
            <label className="query-control query-order-control">
              Order
              <select
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="asc">ASC</option>
                <option value="desc">DESC</option>
              </select>
            </label>
          </div>
        </div>

        <div className="query-filter-row history-query-filter-row">
          <label className="query-control">
            Device
            <select name="device" value={filterInputs.device} onChange={handleFilterChange}>
              <option value="">All</option>
              {devices.map((device) => (
                <option key={device.code} value={device.code}>
                  {device.code}
                </option>
              ))}
            </select>
          </label>
          <label className="query-control">
            Action
            <select name="action" value={filterInputs.action} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="ON">ON</option>
              <option value="OFF">OFF</option>
            </select>
          </label>
          <label className="query-control">
            Status
            <select name="status" value={filterInputs.status} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="ON">ON</option>
              <option value="OFF">OFF</option>
            </select>
          </label>
          <label className="query-control history-time-control">
            From time
            <input name="fromTime" type="text" placeholder={DATE_TIME_FORMAT} value={filterInputs.fromTime} onChange={handleFilterChange} />
          </label>
          <label className="query-control history-time-control">
            To time
            <input name="toTime" type="text" placeholder={DATE_TIME_FORMAT} value={filterInputs.toTime} onChange={handleFilterChange} />
          </label>
          <div className="filter-actions query-actions">
            <button className="secondary-button" type="button" onClick={handleResetFilters}>
              Reset
            </button>
            <button className="primary-button" type="button" onClick={handleApplyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
        {filterError && <p className="query-error" role="alert">{filterError}</p>}
      </section>

      <p className="result-info">
        Showing {firstItem}-{lastItem} of {result.length} records
      </p>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Device</th>
              <th>Action</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {pageRecords.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-table-cell">
                  No data found.
                </td>
              </tr>
            ) : (
              pageRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>{record.device}</td>
                  <td>
                    <span className={record.action === "ON" ? "action-badge is-on" : "action-badge is-off"}>
                      {record.action}
                    </span>
                  </td>
                  <td>
                    <span className={record.status === "ON" ? "status-badge is-on" : "status-badge is-off"}>
                      {record.status}
                    </span>
                  </td>
                  <td>{formatDateTime(record.createdAt)}</td>
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
        label="Action History pages"
      />
    </section>
  );
}

export default ActionHistory;
