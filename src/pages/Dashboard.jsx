import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { Badge, Card, PageHeader, StatCard } from '../components/UI';
import { formatDate, todayISO } from '../utils/helpers';

export default function Dashboard() {
  const { members, staff, services, schedules, rooms, inventory, maintenance } = useAppData();
  const today = todayISO();
  const todaysSchedules = schedules.filter((item) => item.date === today && item.status !== 'Cancelled');
  const activeMembers = members.filter((item) => item.status === 'Active').length;
  const activeStaff = staff.filter((item) => item.status === 'Active').length;
  const availableRooms = rooms.filter((item) => item.status === 'Available').length;
  const lowStock = inventory.filter((item) => item.quantity <= item.minimum);
  const openMaintenance = maintenance.filter((item) => item.status !== 'Resolved');

  const memberName = (id) => members.find((item) => item.id === id)?.name || id;
  const staffName = (id) => staff.find((item) => item.id === id)?.name || id;
  const serviceName = (id) => services.find((item) => item.id === id)?.name || id;

  return (
    <>
      <PageHeader
        eyebrow="Operations overview"
        title="Dashboard"
        description={`A live prototype view of care operations for ${formatDate(today)}.`}
        actions={<Link className="button button-primary" to="/scheduling">+ Create booking</Link>}
      />

      <div className="stats-grid">
        <StatCard label="Active members" value={activeMembers} helper={`${members.length} total records`} icon="♥" />
        <StatCard label="Active staff" value={activeStaff} helper={`${staff.length} staff profiles`} icon="♙" tone="blue" />
        <StatCard label="Today's services" value={todaysSchedules.length} helper="Scheduled care activities" icon="◷" tone="purple" />
        <StatCard label="Rooms available" value={availableRooms} helper={`${rooms.length} rooms managed`} icon="⌂" tone="green" />
        <StatCard label="Low stock items" value={lowStock.length} helper="At/below minimum level" icon="!" tone="orange" />
        <StatCard label="Open maintenance" value={openMaintenance.length} helper="Facility issues to review" icon="⚒" tone="red" />
      </div>

      <div className="dashboard-grid">
        <Card
          title="Today's schedule"
          subtitle="Services and staff assignments"
          action={<Link className="text-link" to="/scheduling">View schedule →</Link>}
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Time</th><th>Member</th><th>Service</th><th>Staff</th><th>Status</th></tr>
              </thead>
              <tbody>
                {todaysSchedules.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.time}</strong></td>
                    <td>{memberName(item.memberId)}</td>
                    <td>{serviceName(item.serviceId)}</td>
                    <td>{staffName(item.staffId)}</td>
                    <td><Badge>{item.status}</Badge></td>
                  </tr>
                ))}
                {!todaysSchedules.length && <tr><td colSpan="5" className="muted-cell">No services scheduled today.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Attention required" subtitle="Operational alerts generated from current prototype data">
          <div className="alert-list">
            {lowStock.slice(0, 3).map((item) => (
              <Link className="alert-item" key={item.id} to="/inventory">
                <div className="alert-symbol alert-warning">!</div>
                <div><strong>Low inventory</strong><span>{item.name}: {item.quantity} remaining</span></div>
                <span>›</span>
              </Link>
            ))}
            {openMaintenance.slice(0, 2).map((item) => (
              <Link className="alert-item" key={item.id} to="/facilities">
                <div className="alert-symbol alert-danger">⚒</div>
                <div><strong>{item.priority} maintenance</strong><span>{item.location}: {item.issue}</span></div>
                <span>›</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="dashboard-grid dashboard-grid-bottom">
        <Card title="Service catalogue" subtitle="Active services available to Scheduling">
          <div className="mini-list">
            {services.map((service) => (
              <div className="mini-list-row" key={service.id}>
                <div>
                  <strong>{service.name}</strong>
                  <span>{service.duration} min · {service.facilityRequirement}</span>
                </div>
                <Badge>{service.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Room availability" subtitle="Current residential room status">
          <div className="room-summary-grid">
            {rooms.map((room) => (
              <div className={`room-tile room-${room.status.toLowerCase()}`} key={room.id}>
                <strong>{room.number}</strong>
                <span>{room.type}</span>
                <Badge>{room.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
