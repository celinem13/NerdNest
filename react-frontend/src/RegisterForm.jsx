import { useState } from "react";
import { registerUser } from "./api";

export default function RegisterForm({ onRegister }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const result = await registerUser({
        username,
        email,
        password
      });

      onRegister(result);

      setPassword("");
      setPasswordConfirmation("");
    } catch (requestError) {
      setError(
        requestError.message || "Registration failed"
      );
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
      <h2>Create an account</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: 8
        }}
      >
        <label htmlFor="register-username">
          Username
        </label>

        <input
          id="register-username"
          type="text"
          value={username}
          onChange={(event) =>
            setUsername(event.target.value)
          }
          autoComplete="username"
          minLength={3}
          maxLength={30}
          required
        />

        <label htmlFor="register-email">
          Email
        </label>

        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          autoComplete="email"
          required
        />

        <label htmlFor="register-password">
          Password
        </label>

        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          autoComplete="new-password"
          minLength={8}
          required
        />

        <label htmlFor="register-password-confirmation">
          Confirm password
        </label>

        <input
          id="register-password-confirmation"
          type="password"
          value={passwordConfirmation}
          onChange={(event) =>
            setPasswordConfirmation(event.target.value)
          }
          autoComplete="new-password"
          minLength={8}
          required
        />

        <button type="submit" disabled={submitting}>
          {submitting
            ? "Creating account..."
            : "Create account"}
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