import { useState } from "react";
import { devices, mockActionHistory } from "../data/mockData";

const PAGE_SIZE = 20;

const initialFilters = {
  device: "",
  action: "",
  status: "",
  fromTime: "",
  toTime: "",
};

function formatTime(createdAt) {
  return new Date(createdAt).toLocaleString("en-GB");
}

function ActionHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchField, setSearchField] = useState("id");
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterInputs, setFilterInputs] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);

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
    setFilters(filterInputs);
    setCurrentPage(1);
  }

  function handleResetFilters() {
    setFilterInputs(initialFilters);
    setFilters(initialFilters);
    setCurrentPage(1);
  }

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

    if (filters.fromTime && new Date(record.createdAt) < new Date(filters.fromTime)) {
      return false;
    }

    if (filters.toTime && new Date(record.createdAt) > new Date(filters.toTime)) {
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
      <h1>Action History</h1>

      <section className="toolbar search-section">
        <h2>Search</h2>
        <form className="search-controls" onSubmit={handleSearch}>
          <select
            aria-label="Search field"
            value={searchField}
            onChange={(event) => setSearchField(event.target.value)}
          >
            <option value="id">ID</option>
            <option value="device">Device</option>
          </select>
          <input
            aria-label="Search value"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search value"
          />
          <button className="primary-button" type="submit">
            Search
          </button>
        </form>
      </section>

      <section className="toolbar sort-section">
        <label>
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
        <label>
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
      </section>

      <section className="toolbar filter-section">
        <h2>Filters</h2>
        <div className="history-filter-grid">
          <label>
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
          <label>
            Action
            <select name="action" value={filterInputs.action} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="ON">ON</option>
              <option value="OFF">OFF</option>
            </select>
          </label>
          <label>
            Status
            <select name="status" value={filterInputs.status} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="ON">ON</option>
              <option value="OFF">OFF</option>
            </select>
          </label>
          <label>
            From time
            <input name="fromTime" type="datetime-local" value={filterInputs.fromTime} onInput={handleFilterChange} />
          </label>
          <label>
            To time
            <input name="toTime" type="datetime-local" value={filterInputs.toTime} onInput={handleFilterChange} />
          </label>
        </div>
        <div className="filter-actions">
          <button className="primary-button" type="button" onClick={handleApplyFilters}>
            Apply Filters
          </button>
          <button className="secondary-button" type="button" onClick={handleResetFilters}>
            Reset
          </button>
        </div>
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
                  <td>{formatTime(record.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 0 && (
        <nav className="pagination" aria-label="Action History pages">
          <button
            className="page-button"
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              className={pageNumber === currentPage ? "page-button active" : "page-button"}
              type="button"
              onClick={() => setCurrentPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            className="page-button"
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}

export default ActionHistory;
