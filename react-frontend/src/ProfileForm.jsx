import { useState } from "react";
import { createProfile } from "./api";

const EMPTY_FORM = {
  displayName: "",
  interests: "",
  neighborhood: "",
  contact: ""
};

export default function ProfileForm({
  token,
  onProfileCreated
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

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
        token
      );

      onProfileCreated(profile);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setError(
        requestError.message || "Failed to create profile"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: 8,
        margin: "16px 0"
      }}
    >
      <label htmlFor="profile-display-name">
        Display name
      </label>

      <input
        id="profile-display-name"
        name="displayName"
        value={form.displayName}
        onChange={handleChange}
        required
      />

      <label htmlFor="profile-interests">
        Interests
      </label>

      <input
        id="profile-interests"
        name="interests"
        placeholder="Pokémon, programming, streaming"
        value={form.interests}
        onChange={handleChange}
      />

      <label htmlFor="profile-neighborhood">
        Neighborhood
      </label>

      <input
        id="profile-neighborhood"
        name="neighborhood"
        value={form.neighborhood}
        onChange={handleChange}
      />

      <label htmlFor="profile-contact">
        Discord/contact
      </label>

      <input
        id="profile-contact"
        name="contact"
        value={form.contact}
        onChange={handleChange}
      />

      <button type="submit" disabled={submitting}>
        {submitting
          ? "Creating profile..."
          : "Create Profile"}
      </button>

      {error && (
        <p role="alert" style={{ color: "crimson" }}>
          {error}
        </p>
      )}
    </form>
  );
}