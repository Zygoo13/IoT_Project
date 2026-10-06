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
  const [pageIndex, setPageIndex] = useState(0);
  const [historyPage, setHistoryPage] = useState(EMPTY_PAGE);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [sortOrder, setSortOrder] = useState("DESC");

  const [filterInput, setFilterInput] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

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

  function handleApplyFilters() {
    const rangeError = getDateRangeError(
      filterInput.fromTime,
      filterInput.toTime,
    );

    if (rangeError) {
      setFilterError(rangeError);
      return;
    }

    setFilterError("");
    setAppliedFilters({ ...filterInput });
    setPageIndex(0);
  }

  function handleClearFilters() {
    setFilterInput(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setFilterError("");
    setPageIndex(0);
  }

  // Tải lại bảng khi có dữ liệu mới
  useEffect(() => {
    return onRealtime((topic) => {
      if (
        topic === "connected" ||
        topic === "devices" ||
        topic === "notifications"
      ) {
        refreshPage();
      }
    });
  }, []);

  // Tải lịch sử điều khiển
  useEffect(() => {
    let isCancelled = false;

    async function loadHistoryPage() {
      const parameters = {
        page: pageIndex,
        size: PAGE_SIZE,
        sortBy: "ID",
        order: sortOrder,
        search: appliedSearch,
        device: appliedFilters.device,
        action: appliedFilters.action,
        status: appliedFilters.status,
        from: appliedFilters.fromTime
          ? parseDateTime(
            appliedFilters.fromTime,
          )?.toISOString()
          : null,
        to: appliedFilters.toTime
          ? parseDateTime(
            appliedFilters.toTime,
          )?.toISOString()
          : null,
      };

      setIsLoading(true);
      setHistoryPage(EMPTY_PAGE);

      try {
        const queryString =
          buildQueryString(parameters);

        const result = await requestApi(
          `/action-history?${queryString}`,
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
          setHistoryPage(result);
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
              ? "Không tải được lịch sử điều khiển."
              : "Không thể kết nối máy chủ.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadHistoryPage();

    return () => {
      isCancelled = true;
    };
  }, [
    pageIndex,
    appliedSearch,
    appliedFilters,
    sortOrder,
    refreshVersion,
  ]);

  const firstRecordNumber =
    historyPage.totalElements
      ? pageIndex * PAGE_SIZE + 1
      : 0;

  const lastRecordNumber =
    historyPage.totalElements
      ? firstRecordNumber +
      historyPage.content.length -
      1
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
            onSubmit={handleSearch}
          >
            <label className="query-control query-search-input">
              Tìm kiếm

              <input
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="ID, thiết bị, lệnh, trạng thái hoặc thời gian"
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

        <div className="query-filter-row history-query-filter-row">
          <label className="query-control">
            Thiết bị

            <select
              value={filterInput.device}
              onChange={(event) =>
                setFilterInput({
                  ...filterInput,
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
              value={filterInput.action}
              onChange={(event) =>
                setFilterInput({
                  ...filterInput,
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
              value={filterInput.status}
              onChange={(event) =>
                setFilterInput({
                  ...filterInput,
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
              value={filterInput.fromTime}
              onChange={(event) =>
                setFilterInput({
                  ...filterInput,
                  fromTime: event.target.value,
                })
              }
            />
          </label>

          <label className="query-control history-time-control">
            Đến thời điểm

            <input
              placeholder={DATE_TIME_FORMAT}
              value={filterInput.toTime}
              onChange={(event) =>
                setFilterInput({
                  ...filterInput,
                  toTime: event.target.value,
                })
              }
            />
          </label>

          <div className="filter-actions query-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={handleClearFilters}
            >
              Xóa lọc
            </button>

            <button
              className="primary-button"
              type="button"
              onClick={handleApplyFilters}
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
          : `Hiển thị ${firstRecordNumber}-${lastRecordNumber} trên tổng số ${historyPage.totalElements} bản ghi`}
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
            {historyPage.content.length > 0 ? (
              historyPage.content.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>

                  <td>{record.deviceCode}</td>

                  <td>
                    <span
                      className={`action-badge ${record.action === "ON"
                        ? "is-on"
                        : "is-off"
                        }`}
                    >
                      {record.action === "ON"
                        ? "BẬT"
                        : "TẮT"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${record.status === "ON"
                        ? "is-on"
                        : "is-off"
                        }`}
                    >
                      {record.status === "ON"
                        ? "BẬT"
                        : "TẮT"}
                    </span>
                  </td>

                  <td>
                    {formatDateTime(
                      record.createdAt,
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
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
        totalPages={historyPage.totalPages}
        onPageChange={(pageNumber) =>
          setPageIndex(pageNumber - 1)
        }
        label="Phân trang lịch sử điều khiển"
      />
    </section>
  );
}