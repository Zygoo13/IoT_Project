import { NavLink, useNavigate } from "react-router-dom";

const navigationItems = [
    { to: "/dashboard", label: "Tổng quan" },
    { to: "/data-sensor", label: "Dữ liệu cảm biến" },
    { to: "/action-history", label: "Lịch sử điều khiển" },
    { to: "/profile", label: "Hồ sơ" },
];

function Sidebar() {
    const navigate = useNavigate();

    function handleLogout() {
        localStorage.removeItem("isAuthenticated");
        navigate("/login");
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-title">
                <span>Giám sát IoT</span>
                <small>Môi trường và thiết bị</small>
            </div>

            <nav className="navigation" aria-label="Điều hướng chính">
                {navigationItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <button className="logout-button" type="button" onClick={handleLogout}>
                Đăng xuất
            </button>
        </aside>
    );
}

export default Sidebar;
