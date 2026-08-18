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
      setError("Please enter username and password.");
      return;
    }

    if (username === mockUser.username && password === mockUser.password) {
      localStorage.setItem("isAuthenticated", "true");
      navigate("/dashboard");
      return;
    }

    setError("Invalid username or password.");
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <h1>IoT Monitor</h1>
        <p>Sign in to monitor your environment and devices.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="login-button" type="submit">
            Login
          </button>
        </form>
      </section>
    </div>
  );
}

export default Login;
