import { useEffect, useState } from "react";
import {
  getCurrentProfile,
  getCurrentUser,
  getProfiles
} from "./api";
import LoginForm from "./LoginForm";
import ProfileForm from "./ProfileForm";
import ProfileList, {
  ProfileSummary
} from "./ProfileList";
import RegisterForm from "./RegisterForm";

const TOKEN_STORAGE_KEY = "nerdnestToken";

export default function App() {
  const [auth, setAuth] = useState(null);
  const [restoringSession, setRestoringSession] =
    useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [currentProfile, setCurrentProfile] =
    useState(null);
  const [checkingProfile, setCheckingProfile] =
    useState(false);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function loadProfiles() {
      try {
        setLoading(true);

        const data = await getProfiles();
        setProfiles(data);
      } catch (requestError) {
        setErr(
          requestError.message ||
            "Failed to load profiles"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfiles();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedToken =
        sessionStorage.getItem(TOKEN_STORAGE_KEY);

      if (!storedToken) {
        setRestoringSession(false);
        return;
      }

      try {
        const userData =
          await getCurrentUser(storedToken);

        let profile = null;

        try {
          const profileData =
            await getCurrentProfile(storedToken);

          profile = profileData.profile;
        } catch (profileError) {
          if (profileError.status !== 404) {
            throw profileError;
          }
        }

        if (!cancelled) {
          setAuth({
            token: storedToken,
            user: userData.user
          });

          setCurrentProfile(profile);
        }
      } catch (requestError) {
        sessionStorage.removeItem(
          TOKEN_STORAGE_KEY
        );

        if (!cancelled) {
          setAuth(null);
          setCurrentProfile(null);

          if (requestError.status === 401) {
            setErr(
              "Your session expired. Please log in again."
            );
          } else {
            setErr(
              requestError.message ||
                "Failed to restore your session"
            );
          }
        }
      } finally {
        if (!cancelled) {
          setRestoringSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAuthenticated(result) {
    setAuth(result);

    sessionStorage.setItem(
      TOKEN_STORAGE_KEY,
      result.token
    );

    setErr("");
    setCheckingProfile(true);

    try {
      const data =
        await getCurrentProfile(result.token);

      setCurrentProfile(data.profile);
    } catch (requestError) {
      if (requestError.status === 404) {
        setCurrentProfile(null);
      } else {
        setErr(
          requestError.message ||
            "Failed to check your profile"
        );
      }
    } finally {
      setCheckingProfile(false);
    }
  }

  function handleLogout() {
    setAuth(null);

    sessionStorage.removeItem(
      TOKEN_STORAGE_KEY
    );

    setAuthMode("login");
    setCurrentProfile(null);
    setCheckingProfile(false);
    setErr("");
  }

  function handleProfileCreated(profile) {
    setProfiles((currentProfiles) => [
      profile,
      ...currentProfiles
    ]);

    setCurrentProfile(profile);
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

      {restoringSession ? (
        <p>Restoring your session…</p>
      ) : auth ? (
        <section>
          <p>
            Signed in as{" "}
            <strong>{auth.user.username}</strong>
          </p>

          <button
            type="button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </section>
      ) : (
        <section>
          {authMode === "login" ? (
            <LoginForm
              onLogin={handleAuthenticated}
            />
          ) : (
            <RegisterForm
              onRegister={handleAuthenticated}
            />
          )}

          <button
            type="button"
            onClick={() =>
              setAuthMode((currentMode) =>
                currentMode === "login"
                  ? "register"
                  : "login"
              )
            }
          >
            {authMode === "login"
              ? "Need an account? Register"
              : "Already have an account? Log in"}
          </button>
        </section>
      )}

      {auth && checkingProfile && (
        <p>Checking for your NerdNest profile…</p>
      )}

      {auth &&
        !checkingProfile &&
        currentProfile && (
          <section>
            <h2>Your profile</h2>
            <p>
              <ProfileSummary
                profile={currentProfile}
                showContact={false}
              />
            </p>
          </section>
        )}

      {auth &&
      !checkingProfile &&
      !currentProfile ? (
        <ProfileForm
          token={auth.token}
          onProfileCreated={
            handleProfileCreated
          }
        />
      ) : !restoringSession && !auth ? (
        <p>
          Log in to create your NerdNest profile.
        </p>
      ) : null}

      {err && (
        <p
          role="alert"
          style={{ color: "crimson" }}
        >
          {err}
        </p>
      )}

      <ProfileList
        profiles={profiles}
        loading={loading}
      />

    </div>
  );
}