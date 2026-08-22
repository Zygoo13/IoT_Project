import { useState } from "react";
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
        <h1>Data Sensor</h1>
        <p>Search, filter, and review individual SensorData readings.</p>
      </header>

      <section className="query-panel" aria-label="Data Sensor query controls">
        <div className="query-top-row">
          <form className="search-controls query-search-controls" onSubmit={handleSearch}>
            <label className="query-control query-search-field">
              Search field
              <select
                value={searchField}
                onChange={(event) => setSearchField(event.target.value)}
              >
                <option value="id">ID</option>
                <option value="sensorName">Sensor Type</option>
                <option value="value">Value</option>
                <option value="time">Time</option>
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
                <option value="sensorName">Sensor Type</option>
                <option value="value">Value</option>
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

        <div className="query-filter-row data-query-filter-row">
          <fieldset className="filter-group time-filter-group">
            <legend>Time range</legend>
            <div className="range-controls">
              <label>
                <span>From</span>
                <input name="fromTime" aria-label="From time" type="text" placeholder={DATE_TIME_FORMAT} value={filterInputs.fromTime} onChange={handleFilterChange} />
              </label>
              <label>
                <span>To</span>
                <input name="toTime" aria-label="To time" type="text" placeholder={DATE_TIME_FORMAT} value={filterInputs.toTime} onChange={handleFilterChange} />
              </label>
            </div>
          </fieldset>

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
              <th>Sensor Type</th>
              <th>Value</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {pageRecords.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-table-cell">
                  No data found.
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

      {totalPages > 0 && (
        <nav className="pagination" aria-label="Data Sensor pages">
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

export default DataSensor;
