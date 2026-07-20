export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5174";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const requestError = new Error(
      data?.error || `Request failed with status ${response.status}`
    );

    requestError.status = response.status;
    throw requestError;
  }

  return data;
}

export function registerUser({ username, email, password }) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username,
      email,
      password
    })
  });
}

export function loginUser({ identifier, password }) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier,
      password
    })
  });
}

export function getCurrentUser(token) {
  return request("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getProfiles() {
  return request("/api/profiles");
}

export function getCurrentProfile(token) {
  return request("/api/profiles/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createProfile(body, token) {
  return request("/api/profiles", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
}