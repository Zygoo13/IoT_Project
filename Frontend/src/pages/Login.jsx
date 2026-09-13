import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { mockUser } from "../data/mockData";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  function handleSubmit(event) {
    event.preventDefault();

    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    if (username === mockUser.username && password === mockUser.password) {
      localStorage.setItem("isAuthenticated", "true");
      navigate("/dashboard");
      return;
    }

    setError("Tên đăng nhập hoặc mật khẩu không đúng.");
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <p className="login-eyebrow">Hệ thống giám sát môi trường</p>
        <h1>Đăng nhập</h1>
        <p>Đăng nhập để xem dữ liệu và điều khiển thiết bị.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button className="login-button" type="submit">
            Đăng nhập
          </button>
        </form>
      </section>
    </div>
  );
}

export default Login;
