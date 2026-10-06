import { useEffect, useState } from "react";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  label,
}) {
  const [oNhapTrang, setONhapTrang] = useState(String(currentPage));
  const [thongBaoLoi, setThongBaoLoi] = useState("");

  const idNhapTrang = `${label.toLowerCase().replaceAll(" ", "-")}-input`;

  function xuLyNhapTrang(event) {
    event.preventDefault();

    const soTrang = Number(oNhapTrang);
    const trangKhongHopLe =
      !Number.isInteger(soTrang) || soTrang < 1 || soTrang > totalPages;

    if (trangKhongHopLe) {
      setThongBaoLoi(`Nhập số trang từ 1 đến ${totalPages}.`);
      return;
    }

    setThongBaoLoi("");
    onPageChange(soTrang);
  }

  useEffect(() => {
    setONhapTrang(String(totalPages ? currentPage : 0));
    setThongBaoLoi("");
  }, [currentPage, totalPages]);

  const laTrangDau = totalPages === 0 || currentPage === 1;
  const laTrangCuoi = totalPages === 0 || currentPage === totalPages;

  return (
    <div className="pagination-area">
      <nav className="pagination" aria-label={label}>
        <button
          className="page-button"
          type="button"
          disabled={laTrangDau}
          onClick={() => onPageChange(1)}
        >
          Trang đầu
        </button>

        <button
          className="page-button"
          type="button"
          disabled={laTrangDau}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Trước
        </button>

        <form className="page-jump" onSubmit={xuLyNhapTrang}>
          <label htmlFor={idNhapTrang}>Trang</label>

          <input
            id={idNhapTrang}
            inputMode="numeric"
            value={oNhapTrang}
            disabled={totalPages === 0}
            onChange={(event) => setONhapTrang(event.target.value)}
            aria-invalid={Boolean(thongBaoLoi)}
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
          disabled={laTrangCuoi}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Sau
        </button>

        <button
          className="page-button"
          type="button"
          disabled={laTrangCuoi}
          onClick={() => onPageChange(totalPages)}
        >
          Trang cuối
        </button>
      </nav>

      {thongBaoLoi && (
        <p className="pagination-error" role="alert">
          {thongBaoLoi}
        </p>
      )}
    </div>
  );
}