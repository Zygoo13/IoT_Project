import { Navigate } from "react-router-dom";
import { getAccessToken } from "../services/api";

// Chặn các trang nghiệp vụ khi không có JWT còn hạn.
export default function ProtectedRoute({ children }) {
  return getAccessToken() ? children : <Navigate to="/login" replace />;
}
