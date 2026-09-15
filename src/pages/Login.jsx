import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand"><div className="brand-mark large">C</div><div><h1>CareConnect</h1><p>Aged Care Management</p></div></div>
        <div className="login-copy">
          <span className="prototype-pill">Frontend prototype</span>
          <h2>Welcome back</h2>
          <p>This screen is intentionally a mock login so the security teammate can replace it with Supabase Auth without rebuilding the application UI.</p>
        </div>
        <label className="field"><span className="field-label">Email</span><input type="email" defaultValue="admin@careconnect.local" /></label>
        <label className="field"><span className="field-label">Password</span><input type="password" defaultValue="prototype" /></label>
        <button className="button button-primary button-full" onClick={() => navigate('/dashboard')}>Enter prototype</button>
        <small className="login-note">No real authentication occurs in this frontend-only prototype.</small>
      </div>
      <div className="login-art">
        <div className="login-art-card"><span>Integrated aged-care operations</span><strong>Members · Staff · Services · Scheduling · Facilities · Inventory</strong></div>
      </div>
    </div>
  );
}
