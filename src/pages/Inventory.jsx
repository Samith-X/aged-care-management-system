import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Badge, Card, Field, Modal, Notice, PageHeader, SearchBox } from '../components/UI';
import { formatDate, includesText } from '../utils/helpers';

const blankItem = {
  name: '', category: 'General', location: 'Central Store', quantity: 0, minimum: 0, batch: '', expiry: '', medication: false,
};

export default function Inventory() {
  const { inventory, addInventoryItem, adjustInventory } = useAppData();
  const [tab, setTab] = useState('All Inventory');
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [form, setForm] = useState(blankItem);
  const [selected, setSelected] = useState(null);
  const [adjustment, setAdjustment] = useState({ type: 'Receive', quantity: 1, reason: '' });
  const [message, setMessage] = useState('');

  const filtered = useMemo(() => inventory.filter((item) => {
    const tabMatch = tab === 'All Inventory'
      || (tab === 'Low Stock' && item.quantity <= item.minimum)
      || (tab === 'Medication Stock' && item.medication);
    return tabMatch && includesText([item.id, item.name, item.category, item.location, item.batch], query);
  }), [inventory, tab, query]);

  const lowStock = inventory.filter((item) => item.quantity <= item.minimum);
  const medicationStock = inventory.filter((item) => item.medication);

  const saveItem = () => {
    if (!form.name.trim()) { setMessage('Item name is required.'); return; }
    addInventoryItem(form);
    setAddOpen(false);
    setForm(blankItem);
    setMessage('');
  };

  const startAdjust = (item) => {
    setSelected(item);
    setAdjustment({ type: 'Receive', quantity: 1, reason: '' });
    setMessage('');
    setAdjustOpen(true);
  };

  const saveAdjustment = () => {
    const quantity = Number(adjustment.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) { setMessage('Enter a quantity greater than zero.'); return; }
    const multiplier = adjustment.type === 'Receive' ? 1 : -1;
    adjustInventory(selected.id, multiplier * quantity);
    setAdjustOpen(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Inventory management · I1–I4"
        title="Inventory"
        description="Maintain stock records, quantities, minimum levels, batches and medication inventory."
        actions={<button className="button button-primary" onClick={() => { setMessage(''); setAddOpen(true); }}>+ Add item</button>}
      />

      <div className="stats-grid compact-stats">
        <div className="simple-stat"><span>Total items</span><strong>{inventory.length}</strong></div>
        <div className="simple-stat"><span>Low / out of stock</span><strong>{lowStock.length}</strong></div>
        <div className="simple-stat"><span>Medication items</span><strong>{medicationStock.length}</strong></div>
        <div className="simple-stat"><span>Stock units</span><strong>{inventory.reduce((sum, item) => sum + item.quantity, 0)}</strong></div>
      </div>

      <div className="tabs">
        {['All Inventory', 'Low Stock', 'Medication Stock'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}
      </div>

      <Card>
        <div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search item, category, location or batch…" /></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Item</th><th>Category</th><th>Location</th><th>Quantity</th><th>Minimum</th><th>Batch</th><th>Expiry</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((item) => {
                const stockStatus = item.quantity === 0 ? 'Out of Stock' : item.quantity <= item.minimum ? 'Low Stock' : 'In Stock';
                return (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong><span className="table-secondary">{item.id}</span></td>
                    <td>{item.category}</td>
                    <td>{item.location}</td>
                    <td><strong>{item.quantity}</strong></td>
                    <td>{item.minimum}</td>
                    <td>{item.batch || '—'}</td>
                    <td>{formatDate(item.expiry)}</td>
                    <td><Badge>{stockStatus}</Badge></td>
                    <td><button className="button button-ghost button-small" onClick={() => startAdjust(item)}>Adjust</button></td>
                  </tr>
                );
              })}
              {!filtered.length && <tr><td colSpan="9" className="muted-cell">No inventory items match this view.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {tab === 'Low Stock' && lowStock.length > 0 && (
        <Card title="Restocking workflow" subtitle="Prototype view of low-stock items that require action">
          <div className="restock-list">
            {lowStock.map((item) => (
              <div className="restock-row" key={item.id}>
                <div><strong>{item.name}</strong><span>{item.quantity} on hand · minimum {item.minimum}</span></div>
                <Badge>Low Stock</Badge>
                <button className="button button-secondary button-small" onClick={() => { setSelected(item); setAdjustment({ type: 'Receive', quantity: Math.max(1, item.minimum * 2 - item.quantity), reason: 'Restock request received' }); setMessage(''); setAdjustOpen(true); }}>Receive restock</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={addOpen} title="Add inventory item" onClose={() => setAddOpen(false)} footer={<><button className="button button-ghost" onClick={() => setAddOpen(false)}>Cancel</button><button className="button button-primary" onClick={saveItem}>Save item</button></>}>
        {message && <Notice tone="error">{message}</Notice>}
        <div className="form-grid">
          <Field label="Item name" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Category"><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, medication: e.target.value === 'Medication' })}><option>General</option><option>PPE</option><option>Clinical</option><option>Hygiene</option><option>Medication</option></select></Field>
          <Field label="Storage location"><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          <Field label="Current quantity"><input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
          <Field label="Minimum stock level"><input type="number" min="0" value={form.minimum} onChange={(e) => setForm({ ...form, minimum: e.target.value })} /></Field>
          <Field label="Batch"><input value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} /></Field>
          <Field label="Expiry date"><input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} /></Field>
          <Field label="Medication item"><select value={form.medication ? 'Yes' : 'No'} onChange={(e) => setForm({ ...form, medication: e.target.value === 'Yes', category: e.target.value === 'Yes' ? 'Medication' : form.category })}><option>No</option><option>Yes</option></select></Field>
        </div>
      </Modal>

      <Modal open={adjustOpen} title={selected ? `Adjust stock · ${selected.name}` : 'Adjust stock'} onClose={() => setAdjustOpen(false)} footer={<><button className="button button-ghost" onClick={() => setAdjustOpen(false)}>Cancel</button><button className="button button-primary" onClick={saveAdjustment}>Record movement</button></>}>
        {message && <Notice tone="error">{message}</Notice>}
        {selected && <div className="summary-panel"><strong>Current quantity: {selected.quantity}</strong><span>Minimum level: {selected.minimum}</span><span>Storage: {selected.location}</span></div>}
        <div className="form-grid">
          <Field label="Stock action"><select value={adjustment.type} onChange={(e) => setAdjustment({ ...adjustment, type: e.target.value })}><option>Receive</option><option>Use</option><option>Damaged</option><option>Missing</option></select></Field>
          <Field label="Quantity" required><input type="number" min="1" value={adjustment.quantity} onChange={(e) => setAdjustment({ ...adjustment, quantity: e.target.value })} /></Field>
          <Field label="Adjustment reason"><textarea rows="3" value={adjustment.reason} onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })} placeholder="Optional prototype note" /></Field>
        </div>
      </Modal>
    </>
  );
}
