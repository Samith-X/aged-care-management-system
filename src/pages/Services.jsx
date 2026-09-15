import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Badge, Card, Field, Modal, PageHeader, SearchBox } from '../components/UI';
import { includesText } from '../utils/helpers';

const blank = {
  name: '', description: '', duration: 30, status: 'Active', checklistText: '', requirementsText: '', facilityRequirement: 'None',
};

export default function Services() {
  const { services, addService, updateService } = useAppData();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  const filtered = useMemo(() => services.filter((service) => {
    const matches = includesText([service.id, service.name, service.description, service.facilityRequirement, ...(service.staffRequirements || [])], query);
    return matches && (status === 'All' || service.status === status);
  }), [services, query, status]);

  const startAdd = () => {
    setEditId(''); setForm(blank); setError(''); setOpen(true);
  };

  const startEdit = (service) => {
    setEditId(service.id);
    setForm({
      ...service,
      checklistText: (service.checklist || []).join('\n'),
      requirementsText: (service.staffRequirements || []).join(', '),
    });
    setError(''); setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) { setError('Service name is required.'); return; }
    if (Number(form.duration) <= 0) { setError('Duration must be greater than zero.'); return; }
    const payload = {
      ...form,
      duration: Number(form.duration),
      checklist: form.checklistText.split('\n').map((item) => item.trim()).filter(Boolean),
      staffRequirements: form.requirementsText.split(',').map((item) => item.trim()).filter(Boolean),
    };
    delete payload.checklistText;
    delete payload.requirementsText;
    if (editId) updateService(editId, payload);
    else addService(payload);
    setOpen(false);
  };

  const toggle = (service) => updateService(service.id, { status: service.status === 'Active' ? 'Inactive' : 'Active' });

  return (
    <>
      <PageHeader
        eyebrow="Service management · S1–S4"
        title="Services"
        description="Define the service catalogue, activity checklists, staff requirements, facility dependencies and availability."
        actions={<button className="button button-primary" onClick={startAdd}>+ Create service</button>}
      />

      <Card>
        <div className="toolbar">
          <SearchBox value={query} onChange={setQuery} placeholder="Search services or requirements…" />
          <select className="select-control" value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option><option>Active</option><option>Inactive</option></select>
        </div>
        <div className="service-grid">
          {filtered.map((service) => (
            <article className="service-card" key={service.id}>
              <div className="service-card-head">
                <div><span className="record-id">{service.id}</span><h3>{service.name}</h3></div>
                <Badge>{service.status}</Badge>
              </div>
              <p>{service.description}</p>
              <div className="service-meta">
                <div><span>Expected duration</span><strong>{service.duration} min</strong></div>
                <div><span>Facility</span><strong>{service.facilityRequirement}</strong></div>
              </div>
              <div className="service-section">
                <span className="mini-heading">Eligible staff require</span>
                <div className="tag-row">{service.staffRequirements.length ? service.staffRequirements.map((req) => <span className="tag" key={req}>{req}</span>) : <span className="muted-text">No specific qualification</span>}</div>
              </div>
              <div className="service-section">
                <span className="mini-heading">Activity checklist</span>
                <ol className="checklist-preview">{service.checklist.slice(0, 3).map((item) => <li key={item}>{item}</li>)}{service.checklist.length > 3 && <li>+ {service.checklist.length - 3} more</li>}</ol>
              </div>
              <div className="card-actions">
                <button className="button button-ghost button-small" onClick={() => startEdit(service)}>Edit</button>
                <button className={`button button-small ${service.status === 'Active' ? 'button-danger-ghost' : 'button-secondary'}`} onClick={() => toggle(service)}>{service.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Modal open={open} title={editId ? 'Edit service' : 'Create service'} onClose={() => setOpen(false)} footer={<><button className="button button-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="button button-primary" onClick={save}>{editId ? 'Save changes' : 'Create service'}</button></>}>
        {error && <div className="notice notice-error">{error}</div>}
        <div className="form-grid">
          <Field label="Service name" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Expected duration (minutes)" required><input type="number" min="1" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field>
          <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Inactive</option></select></Field>
          <Field label="Facility requirement"><select value={form.facilityRequirement} onChange={(e) => setForm({ ...form, facilityRequirement: e.target.value })}><option>None</option><option>Accessible Bathroom</option><option>Therapy Room</option><option>Vehicle</option><option>Activity Room</option><option>Medication Room</option></select></Field>
          <Field label="Description"><textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Required skills / qualifications" hint="Comma-separated"><input value={form.requirementsText} onChange={(e) => setForm({ ...form, requirementsText: e.target.value })} /></Field>
          <Field label="Activity checklist" hint="One activity per line"><textarea rows="6" value={form.checklistText} onChange={(e) => setForm({ ...form, checklistText: e.target.value })} /></Field>
        </div>
      </Modal>
    </>
  );
}
