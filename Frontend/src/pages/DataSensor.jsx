import { useState } from "react";
import { mockSensorSamples } from "../data/mockData";

const PAGE_SIZE = 20;

const initialFilters = {
  minTemperature: "",
  maxTemperature: "",
  minHumidity: "",
  maxHumidity: "",
  minLight: "",
  maxLight: "",
  fromTime: "",
  toTime: "",
};

function formatTime(recordedAt) {
  return new Date(recordedAt).toLocaleString("en-GB");
}

function DataSensor() {
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

  let result = [...mockSensorSamples];

  if (searchValue) {
    const valueToFind = searchValue.toLowerCase();

    result = result.filter((sample) => {
      if (searchField === "time") {
        return formatTime(sample.recordedAt).toLowerCase().includes(valueToFind);
      }

      return String(sample[searchField]).toLowerCase().includes(valueToFind);
    });
  }

  result = result.filter((sample) => {
    if (filters.minTemperature !== "" && sample.temperature < Number(filters.minTemperature)) {
      return false;
    }

    if (filters.maxTemperature !== "" && sample.temperature > Number(filters.maxTemperature)) {
      return false;
    }

    if (filters.minHumidity !== "" && sample.humidity < Number(filters.minHumidity)) {
      return false;
    }

    if (filters.maxHumidity !== "" && sample.humidity > Number(filters.maxHumidity)) {
      return false;
    }

    if (filters.minLight !== "" && sample.light < Number(filters.minLight)) {
      return false;
    }

    if (filters.maxLight !== "" && sample.light > Number(filters.maxLight)) {
      return false;
    }

    if (filters.fromTime && new Date(sample.recordedAt) < new Date(filters.fromTime)) {
      return false;
    }

    if (filters.toTime && new Date(sample.recordedAt) > new Date(filters.toTime)) {
      return false;
    }

    return true;
  });

  result.sort((firstSample, secondSample) => {
    let comparison;

    if (sortField === "time") {
      comparison = new Date(firstSample.recordedAt) - new Date(secondSample.recordedAt);
    } else {
      comparison = firstSample[sortField] - secondSample[sortField];
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(result.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageSamples = result.slice(startIndex, startIndex + PAGE_SIZE);
  const firstItem = result.length === 0 ? 0 : startIndex + 1;
  const lastItem = Math.min(startIndex + PAGE_SIZE, result.length);

  return (
    <section className="page data-page">
      <header className="page-header">
        <h1>Data Sensor</h1>
        <p>Search, filter, and review recorded environment samples.</p>
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
                <option value="temperature">Temperature</option>
                <option value="humidity">Humidity</option>
                <option value="light">Light</option>
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
                <option value="temperature">Temperature</option>
                <option value="humidity">Humidity</option>
                <option value="light">Light</option>
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
          <fieldset className="filter-group">
            <legend>Temperature</legend>
            <div className="range-controls">
              <label>
                <span>Min</span>
                <input name="minTemperature" aria-label="Temperature min" type="number" value={filterInputs.minTemperature} onChange={handleFilterChange} />
              </label>
              <label>
                <span>Max</span>
                <input name="maxTemperature" aria-label="Temperature max" type="number" value={filterInputs.maxTemperature} onChange={handleFilterChange} />
              </label>
            </div>
          </fieldset>

          <fieldset className="filter-group">
            <legend>Humidity</legend>
            <div className="range-controls">
              <label>
                <span>Min</span>
                <input name="minHumidity" aria-label="Humidity min" type="number" value={filterInputs.minHumidity} onChange={handleFilterChange} />
              </label>
              <label>
                <span>Max</span>
                <input name="maxHumidity" aria-label="Humidity max" type="number" value={filterInputs.maxHumidity} onChange={handleFilterChange} />
              </label>
            </div>
          </fieldset>

          <fieldset className="filter-group">
            <legend>Light</legend>
            <div className="range-controls">
              <label>
                <span>Min</span>
                <input name="minLight" aria-label="Light min" type="number" value={filterInputs.minLight} onChange={handleFilterChange} />
              </label>
              <label>
                <span>Max</span>
                <input name="maxLight" aria-label="Light max" type="number" value={filterInputs.maxLight} onChange={handleFilterChange} />
              </label>
            </div>
          </fieldset>

          <fieldset className="filter-group time-filter-group">
            <legend>Time range</legend>
            <div className="range-controls">
              <label>
                <span>From</span>
                <input name="fromTime" aria-label="From time" type="datetime-local" value={filterInputs.fromTime} onInput={handleFilterChange} />
              </label>
              <label>
                <span>To</span>
                <input name="toTime" aria-label="To time" type="datetime-local" value={filterInputs.toTime} onInput={handleFilterChange} />
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
      </section>

      <p className="result-info">
        Showing {firstItem}-{lastItem} of {result.length} samples
      </p>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Temperature</th>
              <th>Humidity</th>
              <th>Light</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {pageSamples.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-table-cell">
                  No data found.
                </td>
              </tr>
            ) : (
              pageSamples.map((sample) => (
                <tr key={sample.id}>
                  <td>{sample.id}</td>
                  <td>{sample.temperature} °C</td>
                  <td>{sample.humidity} %</td>
                  <td>{sample.light} lux</td>
                  <td>{formatTime(sample.recordedAt)}</td>
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
