import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Card, Notice, PageHeader } from '../components/UI';

export default function Settings() {
  const { resetDemo } = useAppData();
  const [resetDone, setResetDone] = useState(false);

  const reset = () => {
    if (window.confirm('Reset all prototype data to the original demo dataset?')) {
      resetDemo();
      setResetDone(true);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Prototype configuration"
        title="Settings"
        description="Integration notes for the frontend prototype and the security/Supabase handoff."
      />

      {resetDone && <Notice tone="success">Demo data has been reset.</Notice>}

      <div className="two-column-grid">
        <Card title="Prototype data">
          <p className="body-copy">This frontend currently stores demo changes in browser localStorage so it can be demonstrated without waiting for backend or security integration.</p>
          <button className="button button-danger-ghost" onClick={reset}>Reset demo data</button>
        </Card>

        <Card title="Supabase handoff">
          <div className="integration-list">
            <div><strong>Project</strong><span>Use the existing Team 2F Supabase project.</span></div>
            <div><strong>Environment variables</strong><span>VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY only.</span></div>
            <div><strong>Frontend secret rule</strong><span>Never expose a service_role key or database password in React.</span></div>
          </div>
        </Card>

        <Card title="Security teammate integration">
          <div className="integration-list">
            <div><strong>Authentication</strong><span>Replace the mock login with Supabase Auth.</span></div>
            <div><strong>Protected routes</strong><span>Wrap routes based on authenticated user and role.</span></div>
            <div><strong>RBAC / RLS</strong><span>Enforce permissions in Supabase as well as the UI.</span></div>
            <div><strong>Auditability</strong><span>Backend can add created_by / updated_by and timestamps.</span></div>
          </div>
        </Card>

        <Card title="Suggested role groups">
          <div className="tag-row large-tags">
            <span className="tag">Administrator</span><span className="tag">Manager</span><span className="tag">Nurse</span><span className="tag">Carer</span><span className="tag">Facility Staff</span><span className="tag">Inventory Staff</span>
          </div>
        </Card>
      </div>
    </>
  );
}
