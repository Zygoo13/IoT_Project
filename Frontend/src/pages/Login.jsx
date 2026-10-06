import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  getAccessToken,
  requestApi,
  saveAccessToken,
} from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [thongBaoLoi, setThongBaoLoi] = useState("");
  const [dangTai, setDangTai] = useState(false);

  async function xuLyDangNhap(event) {
    event.preventDefault();
    setThongBaoLoi("");

    if (!tenDangNhap.trim() || !matKhau) {
      setThongBaoLoi("Nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setDangTai(true);

    try {
      const result = await requestApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: tenDangNhap.trim(),
          password: matKhau,
        }),
      });

      saveAccessToken(result.token);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error.status === 401) {
        setThongBaoLoi("Tên đăng nhập hoặc mật khẩu không đúng.");
      } else {
        setThongBaoLoi(
          error.status
            ? "Đăng nhập thất bại. Thử lại."
            : "Không thể kết nối máy chủ.",
        );
      }
    } finally {
      setDangTai(false);
    }
  }

  if (getAccessToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <p className="login-eyebrow">Hệ thống giám sát môi trường</p>
        <h1>Đăng nhập</h1>

        <form className="login-form" onSubmit={xuLyDangNhap}>
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              id="username"
              value={tenDangNhap}
              onChange={(event) => setTenDangNhap(event.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              value={matKhau}
              onChange={(event) => setMatKhau(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          {thongBaoLoi && (
            <p className="login-error" role="alert">
              {thongBaoLoi}
            </p>
          )}

          <button className="login-button" type="submit" disabled={dangTai}>
            {dangTai ? "Đang đăng nhập..." : "Login"}
          </button>
        </form>
      </section>
    </div>
  );
}