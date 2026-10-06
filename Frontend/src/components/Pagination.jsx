import { useEffect, useState } from "react";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  label,
}) {
  const [pageInput, setPageInput] = useState(String(currentPage));
  const [errorMessage, setErrorMessage] = useState("");

  const inputId = `${label
    .toLowerCase()
    .replaceAll(" ", "-")}-input`;

  function handlePageSubmit(event) {
    event.preventDefault();

    const pageNumber = Number(pageInput);

    const isInvalidPage =
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      pageNumber > totalPages;

    if (isInvalidPage) {
      setErrorMessage(
        `Nhập số trang từ 1 đến ${totalPages}.`,
      );
      return;
    }

    setErrorMessage("");
    onPageChange(pageNumber);
  }

  useEffect(() => {
    setPageInput(
      String(totalPages ? currentPage : 0),
    );
    setErrorMessage("");
  }, [currentPage, totalPages]);

  const isFirstPage =
    totalPages === 0 ||
    currentPage === 1;

  const isLastPage =
    totalPages === 0 ||
    currentPage === totalPages;

  return (
    <div className="pagination-area">
      <nav
        className="pagination"
        aria-label={label}
      >
        <button
          className="page-button"
          type="button"
          disabled={isFirstPage}
          onClick={() => onPageChange(1)}
        >
          Trang đầu
        </button>

        <button
          className="page-button"
          type="button"
          disabled={isFirstPage}
          onClick={() =>
            onPageChange(currentPage - 1)
          }
        >
          Trước
        </button>

        <form
          className="page-jump"
          onSubmit={handlePageSubmit}
        >
          <label htmlFor={inputId}>
            Trang
          </label>

          <input
            id={inputId}
            inputMode="numeric"
            value={pageInput}
            disabled={totalPages === 0}
            onChange={(event) =>
              setPageInput(event.target.value)
            }
            aria-invalid={Boolean(errorMessage)}
          />

          <span>/ {totalPages}</span>

          <button
            className="page-button"
            type="submit"
            disabled={totalPages === 0}
          >
            Đến
          </button>
        </form>

        <button
          className="page-button"
          type="button"
          disabled={isLastPage}
          onClick={() =>
            onPageChange(currentPage + 1)
          }
        >
          Sau
        </button>

        <button
          className="page-button"
          type="button"
          disabled={isLastPage}
          onClick={() =>
            onPageChange(totalPages)
          }
        >
          Trang cuối
        </button>
      </nav>

      {errorMessage && (
        <p
          className="pagination-error"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}