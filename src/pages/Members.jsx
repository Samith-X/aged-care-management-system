import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { Badge, Card, Field, Modal, Notice, PageHeader, SearchBox } from '../components/UI';
import { includesText } from '../utils/helpers';

const blank = {
  name: '', dob: '', phone: '', email: '', roomId: '', careLevel: 'Low', status: 'Active',
  accessibility: '', emergencyContact: '', representative: '', carePlan: '',
};

export default function Members() {
  const { members, rooms, addMember } = useAppData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  const availableRooms = useMemo(
    () => rooms.filter((room) => room.status === 'Available' && !room.residentId),
    [rooms],
  );

  const filtered = useMemo(() => members.filter((member) => {
    const matchesSearch = includesText([member.id, member.name, member.room, member.careLevel], query);
    const matchesStatus = status === 'All' || member.status === status;
    return matchesSearch && matchesStatus;
  }), [members, query, status]);

  const save = () => {
    if (!form.name.trim()) {
      setError('Member name is required.');
      return;
    }

    const result = addMember(form);
    if (!result.ok) {
      setError(result.message || 'The member could not be created.');
      return;
    }

    setOpen(false);
    setForm(blank);
    setError('');
    navigate(`/members/${result.member.id}`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Member management · M1"
        title="Members"
        description="Create and maintain resident profiles, care information, contacts and room allocation."
        actions={<button className="button button-primary" onClick={() => { setForm(blank); setError(''); setOpen(true); }}>+ Add member</button>}
      />

      <div className="stats-grid compact-stats member-stats">
        <div className="simple-stat"><span>Total residents</span><strong>{members.length}</strong></div>
        <div className="simple-stat"><span>Active</span><strong>{members.filter((member) => member.status === 'Active').length}</strong></div>
        <div className="simple-stat"><span>High care</span><strong>{members.filter((member) => member.careLevel === 'High').length}</strong></div>
        <div className="simple-stat"><span>Rooms available</span><strong>{availableRooms.length}</strong></div>
      </div>

      <Card>
        <div className="toolbar">
          <SearchBox value={query} onChange={setQuery} placeholder="Search by name, member ID or room…" />
          <select className="select-control" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>All</option><option>Active</option><option>Inactive</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Member</th><th>Room</th><th>Care level</th><th>Contact</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="person-cell">
                      <div className="person-avatar">{member.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
                      <div><strong>{member.name}</strong><span>{member.id}</span></div>
                    </div>
                  </td>
                  <td><span className={member.room === 'Unassigned' ? 'room-unassigned' : 'room-assigned'}>{member.room}</span></td>
                  <td>{member.careLevel}</td>
                  <td><span className="table-primary">{member.phone || '—'}</span><span className="table-secondary">{member.email || '—'}</span></td>
                  <td><Badge>{member.status}</Badge></td>
                  <td className="actions-cell"><Link className="button button-ghost button-small" to={`/members/${member.id}`}>View</Link></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan="6" className="muted-cell">No members match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        title="Add member"
        onClose={() => { setOpen(false); setError(''); }}
        footer={<><button className="button button-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="button button-primary" onClick={save}>Create member</button></>}
      >
        {error && <Notice tone="error">{error}</Notice>}
        <div className="form-section-intro">
          <strong>Resident profile</strong>
          <span>If you choose an available room, Facilities will automatically mark it as Occupied and create the room reservation.</span>
        </div>
        <div className="form-grid">
          <Field label="Full name" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Date of birth"><input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></Field>
          <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Room allocation" hint={availableRooms.length ? 'Only currently available rooms are listed.' : 'No rooms are currently available.'}>
            <select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
              <option value="">Unassigned</option>
              {availableRooms.map((room) => <option key={room.id} value={room.id}>{room.number} · {room.type} · {room.wing}</option>)}
            </select>
          </Field>
          <Field label="Care level"><select value={form.careLevel} onChange={(e) => setForm({ ...form, careLevel: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></Field>
          <Field label="Emergency contact"><input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></Field>
          <Field label="Authorised representative"><input value={form.representative} onChange={(e) => setForm({ ...form, representative: e.target.value })} /></Field>
          <Field label="Accessibility requirements" hint="Mobility, communication or environmental needs"><input value={form.accessibility} onChange={(e) => setForm({ ...form, accessibility: e.target.value })} /></Field>
          <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Inactive</option></select></Field>
          <Field label="Care plan"><textarea rows="4" value={form.carePlan} onChange={(e) => setForm({ ...form, carePlan: e.target.value })} /></Field>
        </div>
      </Modal>
    </>
  );
}
