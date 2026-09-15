import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Badge, Card, Field, Modal, Notice, PageHeader, SearchBox } from '../components/UI';
import { formatDate, includesText, todayISO } from '../utils/helpers';

const blankSchedule = () => ({ date: todayISO(), time: '09:00', memberId: '', serviceId: '', staffId: '', room: '' });

export default function Scheduling() {
  const { schedules, members, staff, services, addSchedule, updateSchedule } = useAppData();
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankSchedule());
  const [message, setMessage] = useState('');

  const memberName = (id) => members.find((item) => item.id === id)?.name || id;
  const staffName = (id) => staff.find((item) => item.id === id)?.name || id;
  const serviceName = (id) => services.find((item) => item.id === id)?.name || id;

  const selectedService = services.find((item) => item.id === form.serviceId);
  const eligibleStaff = useMemo(() => {
    if (!selectedService) return staff.filter((person) => person.status === 'Active');
    return staff.filter((person) => person.status === 'Active' && selectedService.staffRequirements.every((req) => person.qualifications.includes(req)));
  }, [staff, selectedService]);

  const filtered = useMemo(() => schedules.filter((item) => {
    const matchesDate = !dateFilter || item.date === dateFilter;
    const matchesSearch = includesText([
      item.id,
      memberName(item.memberId),
      staffName(item.staffId),
      serviceName(item.serviceId),
      item.room,
      item.status,
    ], query);
    return matchesDate && matchesSearch;
  }).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)), [schedules, query, dateFilter, members, staff, services]);

  const startCreate = () => {
    setForm(blankSchedule());
    setMessage('');
    setOpen(true);
  };

  const save = () => {
    if (!form.memberId || !form.serviceId || !form.staffId || !form.date || !form.time) {
      setMessage('Complete all required booking fields.');
      return;
    }
    const result = addSchedule(form);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setOpen(false);
    setMessage('');
  };

  const changeService = (serviceId) => {
    const service = services.find((item) => item.id === serviceId);
    setForm({
      ...form,
      serviceId,
      staffId: '',
      room: service?.facilityRequirement && service.facilityRequirement !== 'None' ? service.facilityRequirement : 'Not required',
    });
    setMessage('');
  };

  return (
    <>
      <PageHeader
        eyebrow="Integrated scheduling"
        title="Scheduling"
        description="Create service bookings using active services, eligible staff and relevant facility requirements."
        actions={<button className="button button-primary" onClick={startCreate}>+ New booking</button>}
      />

      <div className="workflow-strip">
        <span>Select member</span><b>→</b><span>Choose active service</span><b>→</b><span>Match qualified staff</span><b>→</b><span>Check time</span><b>→</b><span>Confirm booking</span>
      </div>

      <Card>
        <div className="toolbar toolbar-wrap">
          <SearchBox value={query} onChange={setQuery} placeholder="Search member, service, staff or room…" />
          <label className="inline-field"><span>Date</span><input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} /></label>
          {dateFilter && <button className="button button-ghost button-small" onClick={() => setDateFilter('')}>Clear date</button>}
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Member</th><th>Service</th><th>Assigned staff</th><th>Facility / location</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.date)}</td>
                  <td><strong>{item.time}</strong></td>
                  <td>{memberName(item.memberId)}</td>
                  <td>{serviceName(item.serviceId)}</td>
                  <td>{staffName(item.staffId)}</td>
                  <td>{item.room || 'Not required'}</td>
                  <td><Badge>{item.status}</Badge></td>
                  <td>{item.status !== 'Cancelled' && <button className="button button-danger-ghost button-small" onClick={() => updateSchedule(item.id, { status: 'Cancelled' })}>Cancel</button>}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan="8" className="muted-cell">No bookings match the selected filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} title="Create service booking" onClose={() => setOpen(false)} footer={<><button className="button button-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="button button-primary" onClick={save}>Confirm booking</button></>}>
        {message && <Notice tone="error">{message}</Notice>}
        <div className="form-grid">
          <Field label="Member" required>
            <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })}>
              <option value="">Select member…</option>
              {members.filter((m) => m.status === 'Active').map((m) => <option value={m.id} key={m.id}>{m.name} · {m.room}</option>)}
            </select>
          </Field>
          <Field label="Service" required>
            <select value={form.serviceId} onChange={(e) => changeService(e.target.value)}>
              <option value="">Select active service…</option>
              {services.filter((s) => s.status === 'Active').map((s) => <option value={s.id} key={s.id}>{s.name} · {s.duration} min</option>)}
            </select>
          </Field>
          <Field label="Eligible staff" required hint={selectedService ? `Required: ${selectedService.staffRequirements.join(', ') || 'None'}` : 'Select a service first'}>
            <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} disabled={!selectedService}>
              <option value="">Select staff…</option>
              {eligibleStaff.map((person) => <option value={person.id} key={person.id}>{person.name} · {person.role}</option>)}
            </select>
          </Field>
          <Field label="Date" required><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Time" required><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="Facility / location" hint="Automatically populated from the service requirement where applicable"><input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Field>
        </div>
        {selectedService && (
          <div className="summary-panel">
            <strong>Service requirement check</strong>
            <span>Duration: {selectedService.duration} minutes</span>
            <span>Facility: {selectedService.facilityRequirement}</span>
            <span>Qualified staff available: {eligibleStaff.length}</span>
          </div>
        )}
      </Modal>
    </>
  );
}
