import { useEffect, useState } from "react";

function Pagination({ currentPage, totalPages, onPageChange, label }) {
  const [pageInput, setPageInput] = useState(String(currentPage));
  const [error, setError] = useState("");
  const inputId = `${label.toLowerCase().replaceAll(" ", "-")}-input`;

  useEffect(() => {
    setPageInput(String(currentPage));
    setError("");
  }, [currentPage]);

  function handleGo(event) {
    event.preventDefault();
    const pageNumber = Number(pageInput);

    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
      setError(`Nhập số trang từ 1 đến ${totalPages}.`);
      return;
    }

    setError("");
    onPageChange(pageNumber);
  }

  if (totalPages === 0) {
    return null;
  }

  return (
    <div className="pagination-area">
      <nav className="pagination" aria-label={label}>
        <button className="page-button" type="button" disabled={currentPage === 1} onClick={() => onPageChange(1)}>
          Trang đầu
        </button>
        <button className="page-button" type="button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          Trước
        </button>

        <form className="page-jump" onSubmit={handleGo}>
          <label htmlFor={inputId}>Trang</label>
          <input
            id={inputId}
            inputMode="numeric"
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            aria-invalid={Boolean(error)}
          />
          <span>/ {totalPages}</span>
          <button className="page-button" type="submit">Đến</button>
        </form>

        <button className="page-button" type="button" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Sau
        </button>
        <button className="page-button" type="button" disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)}>
          Trang cuối
        </button>
      </nav>
      {error && <p className="pagination-error" role="alert">{error}</p>}
    </div>
  );
}

export default Pagination;
