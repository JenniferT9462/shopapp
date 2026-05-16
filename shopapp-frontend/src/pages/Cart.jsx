import { useState, useEffect } from 'react';
import { cartApi, ordersApi, productsApi } from '../services/api';

const EMPTY = { order_id: '', product_id: '', quantity: '', unit_price: '' };

export default function Cart() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
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
      const [c, o, p] = await Promise.all([cartApi.getAll(), ordersApi.getAll(), productsApi.getAll()]);
      setItems(c);
      setOrders(o);
      setProducts(p);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function startAdd() { setForm(EMPTY); setEditId(null); setShowForm(true); }

  function startEdit(item) {
    setForm({
      order_id: String(item.order_id),
      product_id: String(item.product_id),
      quantity: String(item.quantity),
      unit_price: String(item.unit_price),
    });
    setEditId(item.cart_id);
    setShowForm(true);
  }

  function cancelForm() { setShowForm(false); setEditId(null); setForm(EMPTY); setError(''); }

  function handleProductChange(productId) {
    const p = products.find(p => String(p.product_id) === productId);
    setForm(f => ({ ...f, product_id: productId, unit_price: p ? String(p.price) : f.unit_price }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = {
        order_id: parseInt(form.order_id),
        product_id: parseInt(form.product_id),
        quantity: parseInt(form.quantity),
        unit_price: parseFloat(form.unit_price),
      };
      if (editId) await cartApi.update(editId, data);
      else await cartApi.create(data);
      cancelForm();
      await loadAll();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this cart item?')) return;
    setError('');
    try { await cartApi.delete(id); await loadAll(); }
    catch (e) { setError(e.message); }
  }

  function productName(id) {
    const p = products.find(p => p.product_id === id);
    return p ? p.name : `#${id}`;
  }

  const total = items.reduce((sum, i) => sum + (parseFloat(i.unit_price) * i.quantity), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Cart Items</h1>
        {!showForm && <button className="btn btn-primary" onClick={startAdd}>+ Add Item</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-title">{editId ? 'Edit Cart Item' : 'Add Cart Item'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Order</label>
                <select required value={form.order_id} onChange={e => setForm(f => ({ ...f, order_id: e.target.value }))}>
                  <option value="">Select order…</option>
                  {orders.map(o => <option key={o.order_id} value={o.order_id}>Order #{o.order_id}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Product</label>
                <select required value={form.product_id} onChange={e => handleProductChange(e.target.value)}>
                  <option value="">Select product…</option>
                  {products.map(p => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input required type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Unit Price ($)</label>
                <input required type="number" step="0.01" min="0" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} />
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
        ) : items.length === 0 ? (
          <div className="empty-state"><p>No cart items yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Order #</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.cart_id}>
                    <td>{item.cart_id}</td>
                    <td>{item.order_id}</td>
                    <td>{productName(item.product_id)}</td>
                    <td>{item.quantity}</td>
                    <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td>${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(item)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.cart_id)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700, padding: '0.75rem 1rem', color: '#555' }}>Grand Total</td>
                  <td style={{ fontWeight: 700, padding: '0.75rem 1rem' }}>${total.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
