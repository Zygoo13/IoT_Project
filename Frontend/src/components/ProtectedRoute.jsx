import { Navigate } from "react-router-dom";

import { getAccessToken } from "../services/api";

// Chặn truy cập khi chưa đăng nhập
export default function ProtectedRoute({ children }) {
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}