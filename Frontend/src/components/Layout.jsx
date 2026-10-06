import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { startRealtime, stopRealtime } from "../services/realtime";
import Sidebar from "./Sidebar";

export default function Layout() {
  // Duy trì một kết nối realtime cho các trang sau đăng nhập.
  useEffect(() => {
    startRealtime();
    return stopRealtime;
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
