import { NavLink, useNavigate } from "react-router-dom";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/data-sensor", label: "Data Sensor" },
  { to: "/action-history", label: "Action History" },
  { to: "/profile", label: "Profile" },
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
        <span>IoT Monitor</span>
        <small>Environment & devices</small>
      </div>

      <nav className="navigation" aria-label="Main navigation">
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
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;
