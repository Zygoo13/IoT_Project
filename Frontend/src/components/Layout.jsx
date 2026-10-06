import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { startRealtime, stopRealtime } from "../services/realtime";
import Sidebar from "./Sidebar";

export default function Layout() {
  useEffect(() => {
    startRealtime();

    return () => {
      stopRealtime();
    };
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