import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Badge, Card, Field, Modal, Notice, PageHeader, SearchBox } from '../components/UI';
import { formatDate, includesText, todayISO } from '../utils/helpers';

export default function Facilities() {
  const {
    rooms, members, reservations, maintenance,
    addRoom, reserveRoom, cancelReservation, addMaintenance, updateMaintenance,
  } = useAppData();

  const [tab, setTab] = useState('Rooms');
  const [query, setQuery] = useState('');
  const [roomOpen, setRoomOpen] = useState(false);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [roomForm, setRoomForm] = useState({ number: '', type: 'Single', wing: '', status: 'Available' });
  const [reservationForm, setReservationForm] = useState({ roomId: '', memberId: '', startDate: todayISO() });
  const [maintenanceForm, setMaintenanceForm] = useState({ location: '', issue: '', priority: 'Medium', reported: todayISO() });

  const memberName = (id) => members.find((item) => item.id === id)?.name || '—';
  const roomNumber = (id) => rooms.find((item) => item.id === id)?.number || id;

  const roomRows = useMemo(() => rooms.filter((room) => includesText([room.id, room.number, room.type, room.wing, room.status, memberName(room.residentId)], query)), [rooms, query, members]);
  const reservationRows = useMemo(() => reservations.filter((item) => includesText([item.id, roomNumber(item.roomId), memberName(item.memberId), item.status], query)), [reservations, query, rooms, members]);
  const maintenanceRows = useMemo(() => maintenance.filter((item) => includesText([item.id, item.location, item.issue, item.priority, item.status], query)), [maintenance, query]);

  const saveRoom = () => {
    if (!roomForm.number.trim()) { setMessage('Room number/name is required.'); return; }
    if (rooms.some((room) => room.number.toLowerCase() === roomForm.number.trim().toLowerCase())) { setMessage('Room number must be unique.'); return; }
    addRoom(roomForm);
    setRoomOpen(false);
    setRoomForm({ number: '', type: 'Single', wing: '', status: 'Available' });
    setMessage('');
  };

  const saveReservation = () => {
    if (!reservationForm.roomId || !reservationForm.memberId) { setMessage('Select both an available room and member.'); return; }
    const result = reserveRoom(reservationForm);
    if (!result.ok) { setMessage(result.message); return; }
    setReservationOpen(false);
    setReservationForm({ roomId: '', memberId: '', startDate: todayISO() });
    setMessage('');
  };

  const saveMaintenance = () => {
    if (!maintenanceForm.location.trim() || !maintenanceForm.issue.trim()) { setMessage('Location and issue details are required.'); return; }
    addMaintenance(maintenanceForm);
    setMaintenanceOpen(false);
    setMaintenanceForm({ location: '', issue: '', priority: 'Medium', reported: todayISO() });
    setMessage('');
  };

  const availableRooms = rooms.filter((room) => room.status === 'Available');
  const unassignedMembers = members.filter((member) => member.status === 'Active' && member.room === 'Unassigned');

  return (
    <>
      <PageHeader
        eyebrow="Facility management · F1–F4"
        title="Facilities"
        description="Manage room records, reservations and maintenance while keeping room availability accurate."
        actions={
          <div className="button-row">
            {tab === 'Rooms' && <button className="button button-primary" onClick={() => { setMessage(''); setRoomOpen(true); }}>+ Add room</button>}
            {tab === 'Reservations' && <button className="button button-primary" onClick={() => { setMessage(''); setReservationOpen(true); }}>+ Reserve room</button>}
            {tab === 'Maintenance' && <button className="button button-primary" onClick={() => { setMessage(''); setMaintenanceOpen(true); }}>+ Report issue</button>}
          </div>
        }
      />

      <div className="stats-grid compact-stats">
        <div className="simple-stat"><span>Total rooms</span><strong>{rooms.length}</strong></div>
        <div className="simple-stat"><span>Available</span><strong>{availableRooms.length}</strong></div>
        <div className="simple-stat"><span>Occupied</span><strong>{rooms.filter((room) => room.status === 'Occupied').length}</strong></div>
        <div className="simple-stat"><span>Open maintenance</span><strong>{maintenance.filter((item) => item.status !== 'Resolved').length}</strong></div>
      </div>

      <div className="tabs">
        {['Rooms', 'Reservations', 'Maintenance'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => { setTab(item); setQuery(''); }}>{item}</button>)}
      </div>

      <Card>
        <div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder={`Search ${tab.toLowerCase()}…`} /></div>

        {tab === 'Rooms' && (
          <div className="table-wrap"><table><thead><tr><th>Room</th><th>Type</th><th>Wing</th><th>Status</th><th>Resident</th></tr></thead><tbody>
            {roomRows.map((room) => <tr key={room.id}><td><strong>{room.number}</strong><span className="table-secondary">{room.id}</span></td><td>{room.type}</td><td>{room.wing}</td><td><Badge>{room.status}</Badge></td><td>{memberName(room.residentId)}</td></tr>)}
            {!roomRows.length && <tr><td colSpan="5" className="muted-cell">No rooms match your search.</td></tr>}
          </tbody></table></div>
        )}

        {tab === 'Reservations' && (
          <div className="table-wrap"><table><thead><tr><th>Reservation</th><th>Room</th><th>Member</th><th>Start date</th><th>Status</th><th></th></tr></thead><tbody>
            {reservationRows.map((item) => <tr key={item.id}><td><strong>{item.id}</strong></td><td>{roomNumber(item.roomId)}</td><td>{memberName(item.memberId)}</td><td>{formatDate(item.startDate)}</td><td><Badge>{item.status}</Badge></td><td>{item.status === 'Active' && <button className="button button-danger-ghost button-small" onClick={() => cancelReservation(item.id)}>Cancel reservation</button>}</td></tr>)}
            {!reservationRows.length && <tr><td colSpan="6" className="muted-cell">No reservations match your search.</td></tr>}
          </tbody></table></div>
        )}

        {tab === 'Maintenance' && (
          <div className="table-wrap"><table><thead><tr><th>Issue</th><th>Location</th><th>Priority</th><th>Reported</th><th>Status</th><th></th></tr></thead><tbody>
            {maintenanceRows.map((item) => <tr key={item.id}><td><strong>{item.issue}</strong><span className="table-secondary">{item.id}</span></td><td>{item.location}</td><td><Badge tone={item.priority === 'High' ? 'high' : item.priority === 'Medium' ? 'medium' : 'low'}>{item.priority}</Badge></td><td>{formatDate(item.reported)}</td><td><Badge>{item.status}</Badge></td><td>{item.status !== 'Resolved' && <button className="button button-secondary button-small" onClick={() => updateMaintenance(item.id, { status: 'Resolved' })}>Mark resolved</button>}</td></tr>)}
            {!maintenanceRows.length && <tr><td colSpan="6" className="muted-cell">No maintenance issues match your search.</td></tr>}
          </tbody></table></div>
        )}
      </Card>

      <Modal open={roomOpen} title="Add room record" onClose={() => setRoomOpen(false)} footer={<><button className="button button-ghost" onClick={() => setRoomOpen(false)}>Cancel</button><button className="button button-primary" onClick={saveRoom}>Save room</button></>}>
        {message && <Notice tone="error">{message}</Notice>}
        <div className="form-grid">
          <Field label="Room number / name" required><input value={roomForm.number} onChange={(e) => setRoomForm({ ...roomForm, number: e.target.value })} placeholder="e.g. D-01" /></Field>
          <Field label="Room type"><select value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}><option>Single</option><option>Shared</option><option>Accessible</option></select></Field>
          <Field label="Wing / location"><input value={roomForm.wing} onChange={(e) => setRoomForm({ ...roomForm, wing: e.target.value })} placeholder="e.g. D Wing" /></Field>
          <Field label="Initial status"><select value={roomForm.status} onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}><option>Available</option><option>Maintenance</option></select></Field>
        </div>
      </Modal>

      <Modal open={reservationOpen} title="Reserve room for resident" onClose={() => setReservationOpen(false)} footer={<><button className="button button-ghost" onClick={() => setReservationOpen(false)}>Cancel</button><button className="button button-primary" onClick={saveReservation}>Confirm reservation</button></>}>
        {message && <Notice tone="error">{message}</Notice>}
        <div className="form-grid">
          <Field label="Available room" required><select value={reservationForm.roomId} onChange={(e) => setReservationForm({ ...reservationForm, roomId: e.target.value })}><option value="">Select room…</option>{availableRooms.map((room) => <option key={room.id} value={room.id}>{room.number} · {room.type}</option>)}</select></Field>
          <Field label="Resident" required hint={unassignedMembers.length ? 'Only unassigned active members are shown.' : 'All active members already have a room in the demo data.'}><select value={reservationForm.memberId} onChange={(e) => setReservationForm({ ...reservationForm, memberId: e.target.value })}><option value="">Select resident…</option>{unassignedMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></Field>
          <Field label="Start date"><input type="date" value={reservationForm.startDate} onChange={(e) => setReservationForm({ ...reservationForm, startDate: e.target.value })} /></Field>
        </div>
        {!unassignedMembers.length && <Notice>Add or edit a member to make their room “Unassigned” before creating a new reservation.</Notice>}
      </Modal>

      <Modal open={maintenanceOpen} title="Report maintenance issue" onClose={() => setMaintenanceOpen(false)} footer={<><button className="button button-ghost" onClick={() => setMaintenanceOpen(false)}>Cancel</button><button className="button button-primary" onClick={saveMaintenance}>Record issue</button></>}>
        {message && <Notice tone="error">{message}</Notice>}
        <div className="form-grid">
          <Field label="Room / facility area" required><input value={maintenanceForm.location} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, location: e.target.value })} /></Field>
          <Field label="Priority"><select value={maintenanceForm.priority} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></Field>
          <Field label="Issue details" required><textarea rows="5" value={maintenanceForm.issue} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issue: e.target.value })} /></Field>
          <Field label="Reported date"><input type="date" value={maintenanceForm.reported} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, reported: e.target.value })} /></Field>
        </div>
      </Modal>
    </>
  );
}
