import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import { startRealtime, stopRealtime } from "../services/realtime";

function Layout() {
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

export default Layout;



// import { Outlet } from "react-router-dom";
// import Sidebar from "./Sidebar";

// function Layout() {
//   return (
//     <div className="app-layout">
//       <Sidebar />
//       <main className="main-content">
//         <Outlet />
//       </main>
//     </div>
//   );
// }

// export default Layout;
