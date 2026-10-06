import { useEffect, useState } from "react";

import Pagination from "../components/Pagination";
import {
  buildQueryString,
  requestApi,
} from "../services/api";
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
  const [pageIndex, setPageIndex] = useState(0);
  const [sensorPage, setSensorPage] = useState(EMPTY_PAGE);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [sortOrder, setSortOrder] = useState("DESC");

  const [rangeInput, setRangeInput] = useState(EMPTY_RANGE);
  const [appliedRange, setAppliedRange] = useState(EMPTY_RANGE);

  const [filterError, setFilterError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);

  function refreshPage() {
    setRefreshVersion((version) => version + 1);
  }

  function handleSearch(event) {
    event.preventDefault();

    setAppliedSearch(searchInput.trim());
    setPageIndex(0);
  }

  function handleSortOrderChange(event) {
    setSortOrder(event.target.value);
    setPageIndex(0);
  }

  function handleApplyRange() {
    const rangeError = getDateRangeError(
      rangeInput.fromTime,
      rangeInput.toTime,
    );

    if (rangeError) {
      setFilterError(rangeError);
      return;
    }

    setFilterError("");
    setAppliedRange({ ...rangeInput });
    setPageIndex(0);
  }

  function handleClearRange() {
    setRangeInput(EMPTY_RANGE);
    setAppliedRange(EMPTY_RANGE);
    setFilterError("");
    setPageIndex(0);
  }

  // Tải lại bảng khi có dữ liệu mới
  useEffect(() => {
    return onRealtime((topic) => {
      if (
        topic === "sensors" ||
        topic === "connected"
      ) {
        refreshPage();
      }
    });
  }, []);

  // Tải dữ liệu cảm biến
  useEffect(() => {
    let isCancelled = false;

    async function loadSensorPage() {
      const parameters = {
        page: pageIndex,
        size: PAGE_SIZE,
        sortBy: "ID",
        order: sortOrder,
        search: appliedSearch,
        from: appliedRange.fromTime
          ? parseDateTime(
            appliedRange.fromTime,
          )?.toISOString()
          : null,
        to: appliedRange.toTime
          ? parseDateTime(
            appliedRange.toTime,
          )?.toISOString()
          : null,
      };

      setIsLoading(true);
      setSensorPage(EMPTY_PAGE);

      try {
        const queryString =
          buildQueryString(parameters);

        const result = await requestApi(
          `/sensor-data?${queryString}`,
        );

        if (isCancelled) {
          return;
        }

        if (
          pageIndex > 0 &&
          pageIndex >= result.totalPages
        ) {
          setPageIndex(
            Math.max(0, result.totalPages - 1),
          );
        } else {
          setSensorPage(result);
          setErrorMessage("");
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        if (error.status === 400) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(
            error.status
              ? "Không tải được dữ liệu cảm biến."
              : "Không thể kết nối máy chủ.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSensorPage();

    return () => {
      isCancelled = true;
    };
  }, [
    pageIndex,
    appliedSearch,
    appliedRange,
    sortOrder,
    refreshVersion,
  ]);

  const firstRecordNumber =
    sensorPage.totalElements
      ? pageIndex * PAGE_SIZE + 1
      : 0;

  const lastRecordNumber =
    sensorPage.totalElements
      ? firstRecordNumber +
      sensorPage.content.length -
      1
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
            onSubmit={handleSearch}
          >
            <label className="query-control query-search-input">
              Tìm kiếm

              <input
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="ID, loại cảm biến, giá trị hoặc thời gian"
              />
            </label>

            <button
              className="primary-button"
              type="submit"
            >
              Tìm kiếm
            </button>
          </form>

          <div className="sort-controls">
            <label className="query-control query-order-control">
              Thứ tự

              <select
                value={sortOrder}
                onChange={handleSortOrderChange}
              >
                <option value="ASC">
                  Tăng dần
                </option>

                <option value="DESC">
                  Giảm dần
                </option>
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
                  value={rangeInput.fromTime}
                  onChange={(event) =>
                    setRangeInput({
                      ...rangeInput,
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
                  value={rangeInput.toTime}
                  onChange={(event) =>
                    setRangeInput({
                      ...rangeInput,
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
              onClick={handleClearRange}
            >
              Xóa lọc
            </button>

            <button
              className="primary-button"
              type="button"
              onClick={handleApplyRange}
            >
              Áp dụng
            </button>
          </div>
        </div>

        {filterError && (
          <p
            className="query-error"
            role="alert"
          >
            {filterError}
          </p>
        )}
      </section>

      {errorMessage && (
        <p
          className="query-error"
          role="alert"
        >
          {errorMessage}{" "}

          <button
            type="button"
            onClick={refreshPage}
          >
            Thử lại
          </button>
        </p>
      )}

      <p className="result-info">
        {isLoading
          ? "Đang tải..."
          : `Hiển thị ${firstRecordNumber}-${lastRecordNumber} trên tổng số ${sensorPage.totalElements} bản ghi`}
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
            {sensorPage.content.length > 0 ? (
              sensorPage.content.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>

                  <td>
                    {SENSOR_NAMES[
                      record.sensorType
                    ] || record.sensorType}
                  </td>

                  <td>
                    {formatValue(record.value)}{" "}
                    {record.unit}
                  </td>

                  <td>
                    {formatDateTime(
                      record.recordedAt,
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="empty-table-cell"
                >
                  {isLoading
                    ? "Đang tải..."
                    : "Không tìm thấy dữ liệu."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={pageIndex + 1}
        totalPages={sensorPage.totalPages}
        onPageChange={(pageNumber) =>
          setPageIndex(pageNumber - 1)
        }
        label="Phân trang dữ liệu cảm biến"
      />
    </section>
  );
}