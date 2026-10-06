import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  getAccessToken,
  requestApi,
  saveAccessToken,
} from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setErrorMessage("");

    if (!username.trim() || !password) {
      setErrorMessage("Nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await requestApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      saveAccessToken(result.token);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error.status === 401) {
        setErrorMessage(
          "Tên đăng nhập hoặc mật khẩu không đúng.",
        );
      } else {
        setErrorMessage(
          error.status
            ? "Đăng nhập thất bại. Thử lại."
            : "Không thể kết nối máy chủ.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (getAccessToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <p className="login-eyebrow">
          Hệ thống giám sát môi trường
        </p>

        <h1>Đăng nhập</h1>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="username">
              Tên đăng nhập
            </label>

            <input
              id="username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Mật khẩu
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
            />
          </div>

          {errorMessage && (
            <p
              className="login-error"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? "Đang đăng nhập..."
              : "Login"}
          </button>
        </form>
      </section>
    </div>
  );
}