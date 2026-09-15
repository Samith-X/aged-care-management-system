import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { Badge, Card, Field, Modal, Notice, PageHeader } from '../components/UI';
import { formatDate, makeId } from '../utils/helpers';

const tabs = ['Overview', 'Care Plan', 'Care Team', 'Medication', 'Contacts'];

export default function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members, staff, updateMember } = useAppData();
  const member = members.find((item) => item.id === id);
  const [tab, setTab] = useState('Overview');
  const [editOpen, setEditOpen] = useState(false);
  const [medOpen, setMedOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [form, setForm] = useState(member || {});
  const [medForm, setMedForm] = useState({ name: '', dose: '', route: 'Oral', frequency: '', status: 'Active' });
  const [selectedStaff, setSelectedStaff] = useState('');

  const careTeam = useMemo(() => (member?.careTeam || []).map((staffId) => staff.find((item) => item.id === staffId)).filter(Boolean), [member, staff]);

  if (!member) {
    return <Card><Notice tone="error">Member not found.</Notice><button className="button button-primary" onClick={() => navigate('/members')}>Back to members</button></Card>;
  }

  const saveEdit = () => {
    updateMember(member.id, form);
    setEditOpen(false);
  };

  const addMedication = () => {
    if (!medForm.name.trim()) return;
    updateMember(member.id, {
      medications: [...(member.medications || []), { ...medForm, id: makeId('MED', member.medications || []) }],
    });
    setMedForm({ name: '', dose: '', route: 'Oral', frequency: '', status: 'Active' });
    setMedOpen(false);
  };

  const addCareTeamMember = () => {
    if (!selectedStaff || member.careTeam.includes(selectedStaff)) return;
    updateMember(member.id, { careTeam: [...member.careTeam, selectedStaff] });
    setSelectedStaff('');
    setTeamOpen(false);
  };

  const removeCareTeamMember = (staffId) => updateMember(member.id, { careTeam: member.careTeam.filter((item) => item !== staffId) });

  return (
    <>
      <div className="breadcrumbs"><Link to="/members">Members</Link><span>›</span><span>{member.name}</span></div>
      <PageHeader
        eyebrow={`${member.id} · ${member.room}`}
        title={member.name}
        description={`DOB ${formatDate(member.dob)} · ${member.careLevel} care level`}
        actions={<button className="button button-primary" onClick={() => { setForm(member); setEditOpen(true); }}>Edit profile</button>}
      />

      <div className="profile-hero">
        <div className="profile-avatar">{member.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
        <div className="profile-meta">
          <Badge>{member.status}</Badge>
          <span>{member.phone || 'No phone recorded'}</span>
          <span>{member.email || 'No email recorded'}</span>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}
      </div>

      {tab === 'Overview' && (
        <div className="two-column-grid">
          <Card title="Member details">
            <dl className="detail-list">
              <div><dt>Member ID</dt><dd>{member.id}</dd></div>
              <div><dt>Date of birth</dt><dd>{formatDate(member.dob)}</dd></div>
              <div><dt>Room</dt><dd>{member.room}</dd></div>
              <div><dt>Care level</dt><dd>{member.careLevel}</dd></div>
              <div><dt>Status</dt><dd><Badge>{member.status}</Badge></dd></div>
            </dl>
          </Card>
          <Card title="Accessibility requirements">
            <p className="body-copy">{member.accessibility || 'No accessibility requirements recorded.'}</p>
          </Card>
          <Card title="Emergency contact">
            <p className="body-copy">{member.emergencyContact || 'No emergency contact recorded.'}</p>
          </Card>
          <Card title="Authorised representative">
            <p className="body-copy">{member.representative || 'No representative recorded.'}</p>
          </Card>
        </div>
      )}

      {tab === 'Care Plan' && (
        <Card title="Current care plan" subtitle="Prototype care plan summary used across the system">
          <div className="care-plan-box">{member.carePlan || 'No care plan has been recorded.'}</div>
          <button className="button button-secondary" onClick={() => { setForm(member); setEditOpen(true); }}>Update care plan</button>
        </Card>
      )}

      {tab === 'Care Team' && (
        <Card title="Assigned care team" action={<button className="button button-primary button-small" onClick={() => setTeamOpen(true)}>+ Assign staff</button>}>
          <div className="staff-card-list">
            {careTeam.map((person) => (
              <div className="staff-card" key={person.id}>
                <div className="person-avatar">{person.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
                <div><strong>{person.name}</strong><span>{person.role}</span></div>
                <Badge>{person.status}</Badge>
                <button className="button button-danger-ghost button-small" onClick={() => removeCareTeamMember(person.id)}>Remove</button>
              </div>
            ))}
            {!careTeam.length && <p className="muted-text">No staff have been assigned to this member's care team.</p>}
          </div>
        </Card>
      )}

      {tab === 'Medication' && (
        <Card title="Medication records" subtitle="Member medication requirements (separate from medication inventory)" action={<button className="button button-primary button-small" onClick={() => setMedOpen(true)}>+ Add medication</button>}>
          <div className="table-wrap"><table><thead><tr><th>Medication</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Status</th></tr></thead><tbody>
            {(member.medications || []).map((med) => <tr key={med.id}><td><strong>{med.name}</strong></td><td>{med.dose}</td><td>{med.route}</td><td>{med.frequency}</td><td><Badge>{med.status}</Badge></td></tr>)}
            {!(member.medications || []).length && <tr><td colSpan="5" className="muted-cell">No medication records for this member.</td></tr>}
          </tbody></table></div>
        </Card>
      )}

      {tab === 'Contacts' && (
        <div className="two-column-grid">
          <Card title="Contact details"><dl className="detail-list"><div><dt>Phone</dt><dd>{member.phone || '—'}</dd></div><div><dt>Email</dt><dd>{member.email || '—'}</dd></div></dl></Card>
          <Card title="Family / representatives"><dl className="detail-list"><div><dt>Emergency contact</dt><dd>{member.emergencyContact || '—'}</dd></div><div><dt>Representative</dt><dd>{member.representative || '—'}</dd></div></dl></Card>
        </div>
      )}

      <Modal open={editOpen} title="Edit member profile" onClose={() => setEditOpen(false)} footer={<><button className="button button-ghost" onClick={() => setEditOpen(false)}>Cancel</button><button className="button button-primary" onClick={saveEdit}>Save changes</button></>}>
        <div className="form-grid">
          <Field label="Full name" required><input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Date of birth"><input type="date" value={form.dob || ''} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></Field>
          <Field label="Phone"><input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Room"><input value={form.room || ''} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Field>
          <Field label="Care level"><select value={form.careLevel || 'Low'} onChange={(e) => setForm({ ...form, careLevel: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></Field>
          <Field label="Status"><select value={form.status || 'Active'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Inactive</option></select></Field>
          <Field label="Accessibility requirements"><input value={form.accessibility || ''} onChange={(e) => setForm({ ...form, accessibility: e.target.value })} /></Field>
          <Field label="Emergency contact"><input value={form.emergencyContact || ''} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></Field>
          <Field label="Authorised representative"><input value={form.representative || ''} onChange={(e) => setForm({ ...form, representative: e.target.value })} /></Field>
          <Field label="Care plan"><textarea rows="5" value={form.carePlan || ''} onChange={(e) => setForm({ ...form, carePlan: e.target.value })} /></Field>
        </div>
      </Modal>

      <Modal open={medOpen} title="Add medication record" onClose={() => setMedOpen(false)} footer={<><button className="button button-ghost" onClick={() => setMedOpen(false)}>Cancel</button><button className="button button-primary" onClick={addMedication}>Add medication</button></>}>
        <div className="form-grid">
          <Field label="Medication" required><input value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} /></Field>
          <Field label="Dose"><input value={medForm.dose} onChange={(e) => setMedForm({ ...medForm, dose: e.target.value })} /></Field>
          <Field label="Route"><select value={medForm.route} onChange={(e) => setMedForm({ ...medForm, route: e.target.value })}><option>Oral</option><option>Topical</option><option>Inhaled</option><option>Subcutaneous</option><option>Other</option></select></Field>
          <Field label="Frequency"><input value={medForm.frequency} onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })} /></Field>
        </div>
      </Modal>

      <Modal open={teamOpen} title="Assign care-team member" onClose={() => setTeamOpen(false)} footer={<><button className="button button-ghost" onClick={() => setTeamOpen(false)}>Cancel</button><button className="button button-primary" onClick={addCareTeamMember}>Assign staff</button></>}>
        <Field label="Active staff member" required>
          <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}><option value="">Select staff…</option>{staff.filter((person) => person.status === 'Active' && !member.careTeam.includes(person.id)).map((person) => <option key={person.id} value={person.id}>{person.name} · {person.role}</option>)}</select>
        </Field>
      </Modal>
    </>
  );
}
