import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/login.css";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    if (username.trim() === "" || password.trim() === "") {
      alert("Please enter username and password.");
      return;
    }

try {
  setLoading(true);

  

  const response = await api.post("/auth/login", {
    username: username.trim(),
    password: password,
  });

  

  const data = response.data.data;

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  navigate("/dashboard");

} catch (error) {
  

  const message =
    error.response?.data?.message ||
    error.response?.data?.error?.message ||
    "Invalid username or password.";

  alert(message);

} finally {
  setLoading(false);
}
  }

  return (
    <div className="login-page">

      <div className="login-card">

        <h1>File Retention System</h1>

        <p className="login-subtitle">
          Login to your account
        </p>

        <form onSubmit={handleLogin}>

          <label>Username</label>

          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;