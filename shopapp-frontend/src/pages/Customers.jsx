import { useState, useEffect } from 'react';
import { customersApi } from '../services/api';

const EMPTY = { name: '', email: '', phone: '', address: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try { setCustomers(await customersApi.getAll()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function startAdd() { setForm(EMPTY); setEditId(null); setShowForm(true); }

  function startEdit(c) {
    setForm({ name: c.name, email: c.email, phone: c.phone || '', address: c.address || '' });
    setEditId(c.customer_id);
    setShowForm(true);
  }

  function cancelForm() { setShowForm(false); setEditId(null); setForm(EMPTY); setError(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editId) await customersApi.update(editId, form);
      else await customersApi.create(form);
      cancelForm();
      await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this customer?')) return;
    setError('');
    try { await customersApi.delete(id); await load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Customers</h1>
        {!showForm && <button className="btn btn-primary" onClick={startAdd}>+ Add Customer</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-title">{editId ? 'Edit Customer' : 'New Customer'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Name</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
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
        ) : customers.length === 0 ? (
          <div className="empty-state"><p>No customers yet. Add one above!</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.customer_id}>
                    <td>{c.customer_id}</td>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || <span style={{ color: '#bbb' }}>—</span>}</td>
                    <td>{c.address || <span style={{ color: '#bbb' }}>—</span>}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(c)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.customer_id)}>Delete</button>
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
