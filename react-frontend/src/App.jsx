import { useEffect, useState } from 'react';
import { getProfiles, createProfile } from './api';

export default function App() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    displayName: '',
    interests: '',
    neighborhood: '',
    contact: '',
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getProfiles();
        setProfiles(data);
      } catch (e) {
        setErr(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    try {
      const doc = await createProfile({
        displayName: form.displayName,
        interests: form.interests.split(',').map(s => s.trim()).filter(Boolean),
        neighborhood: form.neighborhood,
        contact: form.contact,
      });
      setProfiles(p => [doc, ...p]);
      setForm({ displayName:'', interests:'', neighborhood:'', contact:'' });
    } catch (e) {
      setErr(e.message || 'Create failed');
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>NerdNest — Profiles</h1>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        <input placeholder="Display name" value={form.displayName}
               onChange={e=>setForm({ ...form, displayName:e.target.value })} required />
        <input placeholder="Interests (comma-separated)" value={form.interests}
               onChange={e=>setForm({ ...form, interests: e.target.value })} />
        <input placeholder="Neighborhood" value={form.neighborhood}
               onChange={e=>setForm({ ...form, neighborhood: e.target.value })} />
        <input placeholder="Discord/contact" value={form.contact}
               onChange={e=>setForm({ ...form, contact: e.target.value })} />
        <button type="submit">Create Profile</button>
      </form>

      {err && <p style={{ color: 'crimson' }}>{err}</p>}

      {loading ? <p>Loading…</p> : (
        <ul>
          {profiles.map(p => (
            <li key={p._id} style={{ marginBottom: 8 }}>
              <strong>{p.displayName}</strong>
              {p.neighborhood ? ` — ${p.neighborhood}` : ''}
              {p.interests?.length ? ` — [${p.interests.join(', ')}]` : ''}
              {p.contact ? ` — ${p.contact}` : ''}
            </li>
          ))}
          {!profiles.length && <li>No profiles yet.</li>}
        </ul>
      )}
    </div>
  );
}
