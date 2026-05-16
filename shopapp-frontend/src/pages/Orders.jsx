import { useState, useEffect } from 'react';
import { ordersApi, customersApi } from '../services/api';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const today = () => new Date().toISOString().split('T')[0];
const EMPTY = { customer_id: '', status: 'pending', total_amount: '', order_date: today() };

function statusBadge(status) {
  const cls = `badge badge-${status || 'pending'}`;
  return <span className={cls}>{status || 'pending'}</span>;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [o, c] = await Promise.all([ordersApi.getAll(), customersApi.getAll()]);
      setOrders(o);
      setCustomers(c);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function startAdd() { setForm(EMPTY); setEditId(null); setShowForm(true); }

  function startEdit(o) {
    const dateStr = o.order_date ? o.order_date.split('T')[0] : today();
    setForm({ customer_id: String(o.customer_id), status: o.status || 'pending', total_amount: o.total_amount || '', order_date: dateStr });
    setEditId(o.order_id);
    setShowForm(true);
  }

  function cancelForm() { setShowForm(false); setEditId(null); setForm(EMPTY); setError(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = { ...form, customer_id: parseInt(form.customer_id), total_amount: parseFloat(form.total_amount) || 0 };
      if (editId) await ordersApi.update(editId, data);
      else await ordersApi.create(data);
      cancelForm();
      await loadAll();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this order?')) return;
    setError('');
    try { await ordersApi.delete(id); await loadAll(); }
    catch (e) { setError(e.message); }
  }

  function customerName(id) {
    const c = customers.find(c => c.customer_id === id);
    return c ? c.name : `#${id}`;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Orders</h1>
        {!showForm && <button className="btn btn-primary" onClick={startAdd}>+ New Order</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-title">{editId ? 'Edit Order' : 'New Order'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Customer</label>
                <select required value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                  <option value="">Select customer…</option>
                  {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Total Amount ($)</label>
                <input type="number" step="0.01" min="0" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Order Date</label>
                <input required type="date" value={form.order_date} onChange={e => setForm(f => ({ ...f, order_date: e.target.value }))} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button className="btn btn-secondary" type="button" onClick={cancelForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="empty-state"><p>No orders yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.order_id}>
                    <td>{o.order_id}</td>
                    <td>{customerName(o.customer_id)}</td>
                    <td>{statusBadge(o.status)}</td>
                    <td>${parseFloat(o.total_amount || 0).toFixed(2)}</td>
                    <td>{o.order_date ? new Date(o.order_date).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(o)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o.order_id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
