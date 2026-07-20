import { useState } from "react";
import { loginUser } from "./api";

export default function LoginForm({ onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await loginUser({
        identifier,
        password
      });

      onLogin(result);
      setPassword("");
    } catch (requestError) {
      setError(requestError.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
    style={{
        maxWidth: 420,
        marginBottom: 24
    }}
    >
      <h2>Log in</h2>

      <form
        onSubmit={handleSubmit}
        style={{
            display: "grid",
            gap: 8
        }}
        >
        <label htmlFor="login-identifier">
          Username or email
        </label>

        <input
          id="login-identifier"
          type="text"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="login-password">
          Password
        </label>

        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: "crimson" }}>
          {error}
        </p>
      )}
    </section>
  );
}