import { NavLink, useNavigate } from "react-router-dom";
import { clearAccessToken } from "../services/api";

const navigationItems = [
  { to: "/dashboard", label: "Tổng quan" },
  { to: "/data-sensor", label: "Dữ liệu cảm biến" },
  { to: "/action-history", label: "Lịch sử điều khiển" },
  { to: "/profile", label: "Hồ sơ" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  function handleLogout() {
    clearAccessToken();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-title"><span>Giám sát IoT</span><small>Môi trường và thiết bị</small></div>
      <nav className="navigation" aria-label="Điều hướng chính">
        {navigationItems.map((navigationItem) => (
          <NavLink key={navigationItem.to} to={navigationItem.to} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            {navigationItem.label}
          </NavLink>
        ))}
      </nav>
      <button className="logout-button" type="button" onClick={handleLogout}>Đăng xuất</button>
    </aside>
  );
}
