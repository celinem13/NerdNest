export default function ProfileSummary({
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