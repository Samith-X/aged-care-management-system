import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Badge, Card, Field, Modal, PageHeader, SearchBox } from '../components/UI';
import { formatDate, includesText } from '../utils/helpers';

const blank = {
  name: '', role: 'Personal Care Worker', employment: 'Permanent', status: 'Active',
  phone: '', email: '', qualificationsText: '', availability: '', credentialExpiry: '',
};

export default function Staff() {
  const { staff, addStaff, updateStaff } = useAppData();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  const filtered = useMemo(() => staff.filter((person) => {
    const matches = includesText([person.id, person.name, person.role, person.employment, ...(person.qualifications || [])], query);
    return matches && (status === 'All' || person.status === status);
  }), [staff, query, status]);

  const startAdd = () => {
    setEditId('');
    setForm(blank);
    setError('');
    setOpen(true);
  };

  const startEdit = (person) => {
    setEditId(person.id);
    setForm({ ...person, qualificationsText: (person.qualifications || []).join(', ') });
    setError('');
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      setError('Staff name is required.');
      return;
    }
    const payload = {
      ...form,
      qualifications: form.qualificationsText.split(',').map((item) => item.trim()).filter(Boolean),
    };
    delete payload.qualificationsText;
    if (editId) updateStaff(editId, payload);
    else addStaff(payload);
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Member & staff management · M3/M4"
        title="Staff"
        description="Maintain staff profiles, roles, qualifications, credentials and availability for scheduling."
        actions={<button className="button button-primary" onClick={startAdd}>+ Add staff</button>}
      />

      <div className="stats-grid compact-stats">
        <div className="simple-stat"><span>Total staff</span><strong>{staff.length}</strong></div>
        <div className="simple-stat"><span>Active</span><strong>{staff.filter((p) => p.status === 'Active').length}</strong></div>
        <div className="simple-stat"><span>Clinical staff</span><strong>{staff.filter((p) => ['Registered Nurse', 'Physiotherapist'].includes(p.role)).length}</strong></div>
        <div className="simple-stat"><span>Credentials due ≤ 90d</span><strong>{staff.filter((p) => p.credentialExpiry && new Date(p.credentialExpiry) <= new Date(Date.now() + 90 * 86400000)).length}</strong></div>
      </div>

      <Card>
        <div className="toolbar">
          <SearchBox value={query} onChange={setQuery} placeholder="Search staff, role or qualification…" />
          <select className="select-control" value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option><option>Active</option><option>Inactive</option></select>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Staff member</th><th>Role</th><th>Employment</th><th>Qualifications</th><th>Availability</th><th>Credential expiry</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((person) => (
                <tr key={person.id}>
                  <td><div className="person-cell"><div className="person-avatar">{person.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}</div><div><strong>{person.name}</strong><span>{person.id}</span></div></div></td>
                  <td>{person.role}</td>
                  <td>{person.employment}</td>
                  <td><div className="tag-row">{person.qualifications.slice(0, 2).map((q) => <span className="tag" key={q}>{q}</span>)}{person.qualifications.length > 2 && <span className="tag">+{person.qualifications.length - 2}</span>}</div></td>
                  <td>{person.availability || '—'}</td>
                  <td>{formatDate(person.credentialExpiry)}</td>
                  <td><Badge>{person.status}</Badge></td>
                  <td><button className="button button-ghost button-small" onClick={() => startEdit(person)}>Edit</button></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan="8" className="muted-cell">No staff match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} title={editId ? 'Edit staff profile' : 'Add staff member'} onClose={() => setOpen(false)} footer={<><button className="button button-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="button button-primary" onClick={save}>{editId ? 'Save changes' : 'Create staff'}</button></>}>
        {error && <div className="notice notice-error">{error}</div>}
        <div className="form-grid">
          <Field label="Full name" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Role"><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>Registered Nurse</option><option>Personal Care Worker</option><option>Physiotherapist</option><option>Facility Administrator</option><option>Inventory Officer</option><option>Manager</option></select></Field>
          <Field label="Employment type"><select value={form.employment} onChange={(e) => setForm({ ...form, employment: e.target.value })}><option>Permanent</option><option>Part-time</option><option>Casual</option><option>Contract</option></select></Field>
          <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Inactive</option></select></Field>
          <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Qualifications" hint="Comma-separated"><input value={form.qualificationsText} onChange={(e) => setForm({ ...form, qualificationsText: e.target.value })} /></Field>
          <Field label="Credential expiry"><input type="date" value={form.credentialExpiry} onChange={(e) => setForm({ ...form, credentialExpiry: e.target.value })} /></Field>
          <Field label="Availability"><input value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="e.g. Mon–Fri 07:00–15:30" /></Field>
        </div>
      </Modal>
    </>
  );
}
