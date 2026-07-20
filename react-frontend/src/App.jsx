import { useEffect, useState } from "react";
import {
  createProfile,
  getCurrentProfile,
  getProfiles
} from "./api";
import LoginForm from "./LoginForm";

export default function App() {
  const [auth, setAuth] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    displayName: "",
    interests: "",
    neighborhood: "",
    contact: ""
  });

  useEffect(() => {
    async function loadProfiles() {
      try {
        setLoading(true);
        const data = await getProfiles();
        setProfiles(data);
      } catch (requestError) {
        setErr(
          requestError.message || "Failed to load profiles"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfiles();
  }, []);

  async function handleLogin(result) {
    setAuth(result);
    setErr("");
    setCheckingProfile(true);

    try {
      const data = await getCurrentProfile(result.token);
      setCurrentProfile(data.profile);
    } catch (requestError) {
      if (requestError.status === 404) {
        setCurrentProfile(null);
      } else {
        setErr(
          requestError.message || "Failed to check your profile"
        );
      }
    } finally {
      setCheckingProfile(false);
    }
  }

  function handleLogout() {
    setAuth(null);
    setCurrentProfile(null);
    setCheckingProfile(false);
    setErr("");
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setErr("");

    if (!auth) {
      setErr("Log in before creating a profile");
      return;
    }

    try {
      const profile = await createProfile(
        {
          displayName: form.displayName,
          interests: form.interests
            .split(",")
            .map((interest) => interest.trim())
            .filter(Boolean),
          neighborhood: form.neighborhood,
          contact: form.contact
        },
        auth.token
      );

      setProfiles((currentProfiles) => [
        profile,
        ...currentProfiles
      ]);

      setCurrentProfile(profile);

      setForm({
        displayName: "",
        interests: "",
        neighborhood: "",
        contact: ""
      });
    } catch (requestError) {
      setErr(
        requestError.message || "Failed to create profile"
      );
    }
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "24px auto",
        fontFamily: "system-ui, sans-serif"
      }}
    >
      <h1>NerdNest — Profiles</h1>

      {auth ? (
        <section>
          <p>
            Signed in as{" "}
            <strong>{auth.user.username}</strong>
          </p>

          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </section>
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}

      {auth && checkingProfile && (
        <p>Checking for your NerdNest profile…</p>
      )}

      {auth && !checkingProfile && currentProfile && (
        <section>
          <h2>Your profile</h2>

          <p>
            <strong>{currentProfile.displayName}</strong>

            {currentProfile.neighborhood
              ? ` — ${currentProfile.neighborhood}`
              : ""}

            {currentProfile.interests?.length
              ? ` — [${currentProfile.interests.join(", ")}]`
              : ""}
          </p>
        </section>
      )}

      {auth && !checkingProfile && !currentProfile ? (
        <form
          onSubmit={handleProfileSubmit}
          style={{
            display: "grid",
            gap: 8,
            margin: "16px 0"
          }}
        >
          <input
            placeholder="Display name"
            value={form.displayName}
            onChange={(event) =>
              setForm({
                ...form,
                displayName: event.target.value
              })
            }
            required
          />

          <input
            placeholder="Interests (comma-separated)"
            value={form.interests}
            onChange={(event) =>
              setForm({
                ...form,
                interests: event.target.value
              })
            }
          />

          <input
            placeholder="Neighborhood"
            value={form.neighborhood}
            onChange={(event) =>
              setForm({
                ...form,
                neighborhood: event.target.value
              })
            }
          />

          <input
            placeholder="Discord/contact"
            value={form.contact}
            onChange={(event) =>
              setForm({
                ...form,
                contact: event.target.value
              })
            }
          />

          <button type="submit">
            Create Profile
          </button>
        </form>
      ) : !auth ? (
        <p>Log in to create your NerdNest profile.</p>
      ) : null}

      {err && (
        <p role="alert" style={{ color: "crimson" }}>
          {err}
        </p>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {profiles.map((profile) => (
            <li
              key={profile._id}
              style={{ marginBottom: 8 }}
            >
              <strong>{profile.displayName}</strong>

              {profile.neighborhood
                ? ` — ${profile.neighborhood}`
                : ""}

              {profile.interests?.length
                ? ` — [${profile.interests.join(", ")}]`
                : ""}

              {profile.contact
                ? ` — ${profile.contact}`
                : ""}
            </li>
          ))}

          {!profiles.length && <li>No profiles yet.</li>}
        </ul>
      )}
    </div>
  );
}