// read the backend URL from .env (VITE_API_URL=http://localhost:5174)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

// fetch all profiles (GET /api/profiles)
export async function getProfiles() {
  const res = await fetch(`${API_URL}/api/profiles`);
  if (!res.ok) throw new Error('Failed to load profiles');
  return res.json();  // turn JSON response into a JS object/array
}
export async function createProfile(body) {
  const res = await fetch(`${API_URL}/api/profiles`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body), // turn JS object into JSON string
  });
  if (!res.ok) throw new Error('Failed to create profile');
  return res.json();
}
