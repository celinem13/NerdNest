import ProfileSummary from "./ProfileSummary";

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