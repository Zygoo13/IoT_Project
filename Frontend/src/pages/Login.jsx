import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, getToken, saveToken } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (getToken()) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Nhập tên đăng nhập và mật khẩu.");
      return;
    }
    setLoading(true);
    try {
      const result = await api("/auth/login", {
        method: "POST", body: JSON.stringify({ username: username.trim(), password }),
      });
      saveToken(result.token);
      navigate("/dashboard", { replace: true });
    } catch (problem) {
      setError(problem.status === 401 ? "Tên đăng nhập hoặc mật khẩu không đúng." :
        problem.status ? "Đăng nhập thất bại. Thử lại." : "Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <p className="login-eyebrow">Hệ thống giám sát môi trường</p>
        <h1>Đăng nhập</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </div>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Login"}
          </button>
        </form>
      </section>
    </div>
  );
}
