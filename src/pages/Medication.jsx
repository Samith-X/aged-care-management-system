import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { Badge, Card, PageHeader, SearchBox } from '../components/UI';
import { includesText } from '../utils/helpers';

export default function Medication() {
  const { members, inventory } = useAppData();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('Member Records');

  const records = useMemo(() => members.flatMap((member) => (member.medications || []).map((med) => ({ ...med, memberId: member.id, memberName: member.name, room: member.room }))), [members]);
  const memberRows = records.filter((row) => includesText([row.memberName, row.room, row.name, row.dose, row.frequency], query));
  const stockRows = inventory.filter((item) => item.medication && includesText([item.name, item.batch, item.location], query));

  return (
    <>
      <PageHeader
        eyebrow="Medication overview"
        title="Medication"
        description="Separate member medication requirements from medication inventory control."
      />

      <div className="tabs">
        {['Member Records', 'Medication Inventory'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => { setTab(item); setQuery(''); }}>{item}</button>)}
      </div>

      <Card>
        <div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder={tab === 'Member Records' ? 'Search member or medication…' : 'Search medication stock…'} /></div>
        {tab === 'Member Records' ? (
          <div className="table-wrap"><table><thead><tr><th>Member</th><th>Room</th><th>Medication</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Status</th><th></th></tr></thead><tbody>
            {memberRows.map((row) => <tr key={`${row.memberId}-${row.id}`}><td><strong>{row.memberName}</strong></td><td>{row.room}</td><td>{row.name}</td><td>{row.dose}</td><td>{row.route}</td><td>{row.frequency}</td><td><Badge>{row.status}</Badge></td><td><Link className="button button-ghost button-small" to={`/members/${row.memberId}`}>Member profile</Link></td></tr>)}
            {!memberRows.length && <tr><td colSpan="8" className="muted-cell">No medication records match your search.</td></tr>}
          </tbody></table></div>
        ) : (
          <div className="table-wrap"><table><thead><tr><th>Medication</th><th>Batch</th><th>Location</th><th>Quantity</th><th>Minimum</th><th>Status</th></tr></thead><tbody>
            {stockRows.map((item) => { const state = item.quantity === 0 ? 'Out of Stock' : item.quantity <= item.minimum ? 'Low Stock' : 'In Stock'; return <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.batch}</td><td>{item.location}</td><td>{item.quantity}</td><td>{item.minimum}</td><td><Badge>{state}</Badge></td></tr>; })}
            {!stockRows.length && <tr><td colSpan="6" className="muted-cell">No medication stock records match your search.</td></tr>}
          </tbody></table></div>
        )}
      </Card>
    </>
  );
}
