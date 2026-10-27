export default function Pagination({ currentPage, totalPages, onPageChange, label }) {
  // Hiển thị tối đa ba số trang quanh trang đang xem.
  const trangBatDau = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
  const cacTrang = [];
  for (let trang = trangBatDau; trang <= Math.min(totalPages, trangBatDau + 2); trang += 1) {
    cacTrang.push(trang);
  }

  return (
    <div className="pagination-area">
      <nav className="pagination" aria-label={label}>
        <button
          className="page-button"
          type="button"
          aria-label="Trang trước"
          disabled={totalPages === 0 || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          &lt;
        </button>
        {cacTrang.map((trang) => (
          <button
            key={trang}
            className={`page-button${trang === currentPage ? " active" : ""}`}
            type="button"
            aria-label={`Trang ${trang}`}
            aria-current={trang === currentPage ? "page" : undefined}
            onClick={() => onPageChange(trang)}
          >
            {trang}
          </button>
        ))}
        <button
          className="page-button"
          type="button"
          aria-label="Trang sau"
          disabled={totalPages === 0 || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          &gt;
        </button>
      </nav>
    </div>
  );
}
