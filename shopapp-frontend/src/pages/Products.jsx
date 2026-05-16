import { useState, useEffect } from 'react';
import { productsApi } from '../services/api';

const EMPTY = { name: '', description: '', price: '', stock_quantity: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
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
    try { setProducts(await productsApi.getAll()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function startAdd() {
    setForm(EMPTY);
    setEditId(null);
    setShowForm(true);
  }

  function startEdit(p) {
    setForm({ name: p.name, description: p.description || '', price: p.price, stock_quantity: p.stock_quantity });
    setEditId(p.product_id);
    setShowForm(true);
  }

  function cancelForm() { setShowForm(false); setEditId(null); setForm(EMPTY); setError(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = { ...form, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity) };
      if (editId) await productsApi.update(editId, data);
      else await productsApi.create(data);
      cancelForm();
      await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return;
    setError('');
    try { await productsApi.delete(id); await load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Products</h1>
        {!showForm && <button className="btn btn-primary" onClick={startAdd}>+ Add Product</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-title">{editId ? 'Edit Product' : 'New Product'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Name</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Price ($)</label>
                <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input required type="number" min="0" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
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
        ) : products.length === 0 ? (
          <div className="empty-state"><p>No products yet. Add one above!</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Description</th><th>Price</th><th>Stock</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.product_id}>
                    <td>{p.product_id}</td>
                    <td>{p.name}</td>
                    <td>{p.description || <span style={{ color: '#bbb' }}>—</span>}</td>
                    <td>${parseFloat(p.price).toFixed(2)}</td>
                    <td>{p.stock_quantity}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.product_id)}>Delete</button>
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
