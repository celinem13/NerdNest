export function ProfileSummary({
  profile,
  showContact = true
}) {
  return (
    <>
      <strong>{profile.displayName}</strong>

      {profile.neighborhood
        ? ` — ${profile.neighborhood}`
        : ""}

      {profile.interests?.length
        ? ` — [${profile.interests.join(", ")}]`
        : ""}

      {showContact && profile.contact
        ? ` — ${profile.contact}`
        : ""}
    </>
  );
}

export default function ProfileList({
  profiles,
  loading
}) {
  if (loading) {
    return <p>Loading…</p>;
  }

  if (!profiles.length) {
    return <p>No profiles yet.</p>;
  }

  return (
    <ul>
      {profiles.map((profile) => (
        <li
          key={profile._id}
          style={{ marginBottom: 8 }}
        >
          <ProfileSummary profile={profile} />
        </li>
      ))}
    </ul>
  );
}