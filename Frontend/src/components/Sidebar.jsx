import { NavLink, useNavigate } from "react-router-dom";

import { clearAccessToken } from "../services/api";

const mucDieuHuong = [
  { to: "/dashboard", label: "Tổng quan" },
  { to: "/data-sensor", label: "Dữ liệu cảm biến" },
  { to: "/action-history", label: "Lịch sử điều khiển" },
  { to: "/profile", label: "Hồ sơ" },
];

export default function Sidebar() {
  const navigate = useNavigate();

  function dangXuat() {
    clearAccessToken();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-title">
        <span>Giám sát IoT</span>
        <small>Môi trường và thiết bị</small>
      </div>

      <nav className="navigation" aria-label="Điều hướng chính">
        {mucDieuHuong.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button className="logout-button" type="button" onClick={dangXuat}>
        Đăng xuất
      </button>
    </aside>
  );
}