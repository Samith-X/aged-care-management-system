import { useAppData } from '../context/AppDataContext';
import { Badge, Card, PageHeader, StatCard } from '../components/UI';

export default function Reports() {
  const { members, staff, services, schedules, rooms, inventory, maintenance } = useAppData();
  const activeBookings = schedules.filter((item) => item.status !== 'Cancelled');
  const lowStock = inventory.filter((item) => item.quantity <= item.minimum);
  const credentialAlerts = staff.filter((person) => person.credentialExpiry && new Date(person.credentialExpiry) <= new Date(Date.now() + 90 * 86400000));

  return (
    <>
      <PageHeader
        eyebrow="Management reporting"
        title="Reports"
        description="Prototype operational summaries generated from the current in-browser dataset."
      />

      <div className="stats-grid">
        <StatCard label="Members" value={members.length} helper={`${members.filter((m) => m.status === 'Active').length} active`} icon="♥" />
        <StatCard label="Staff" value={staff.length} helper={`${credentialAlerts.length} credential alerts`} icon="♙" tone="blue" />
        <StatCard label="Services" value={services.length} helper={`${services.filter((s) => s.status === 'Active').length} active`} icon="◇" tone="purple" />
        <StatCard label="Bookings" value={activeBookings.length} helper={`${schedules.filter((s) => s.status === 'Cancelled').length} cancelled`} icon="◷" tone="green" />
      </div>

      <div className="two-column-grid">
        <Card title="Operational exceptions" subtitle="Items requiring management review">
          <div className="mini-list">
            {lowStock.map((item) => <div className="mini-list-row" key={item.id}><div><strong>{item.name}</strong><span>{item.quantity} on hand · minimum {item.minimum}</span></div><Badge>Low Stock</Badge></div>)}
            {maintenance.filter((item) => item.status !== 'Resolved').map((item) => <div className="mini-list-row" key={item.id}><div><strong>{item.location}</strong><span>{item.issue}</span></div><Badge>{item.priority}</Badge></div>)}
            {!lowStock.length && !maintenance.some((item) => item.status !== 'Resolved') && <p className="muted-text">No operational exceptions.</p>}
          </div>
        </Card>

        <Card title="Facility utilisation" subtitle="Room status summary">
          <div className="report-bars">
            <div><span>Occupied</span><strong>{rooms.filter((room) => room.status === 'Occupied').length}</strong><div className="bar-track"><div style={{ width: `${rooms.length ? (rooms.filter((r) => r.status === 'Occupied').length / rooms.length) * 100 : 0}%` }} /></div></div>
            <div><span>Available</span><strong>{rooms.filter((room) => room.status === 'Available').length}</strong><div className="bar-track"><div style={{ width: `${rooms.length ? (rooms.filter((r) => r.status === 'Available').length / rooms.length) * 100 : 0}%` }} /></div></div>
          </div>
        </Card>

        <Card title="Workforce credential alerts" subtitle="Credentials expiring within approximately 90 days">
          <div className="mini-list">
            {credentialAlerts.map((person) => <div className="mini-list-row" key={person.id}><div><strong>{person.name}</strong><span>{person.role} · expires {person.credentialExpiry}</span></div><Badge>Review</Badge></div>)}
            {!credentialAlerts.length && <p className="muted-text">No credentials are due within the alert period.</p>}
          </div>
        </Card>

        <Card title="Care level distribution" subtitle="Current member profiles">
          <div className="report-bars">
            {['High', 'Medium', 'Low'].map((level) => {
              const count = members.filter((member) => member.careLevel === level).length;
              return <div key={level}><span>{level}</span><strong>{count}</strong><div className="bar-track"><div style={{ width: `${members.length ? (count / members.length) * 100 : 0}%` }} /></div></div>;
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
