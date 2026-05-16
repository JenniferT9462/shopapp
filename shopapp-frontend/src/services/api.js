const BASE_URL = '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

export const productsApi = {
  getAll: () => request('/products/'),
  create: (data) => request('/products/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
};

export const customersApi = {
  getAll: () => request('/customers/'),
  create: (data) => request('/customers/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
};

export const ordersApi = {
  getAll: () => request('/orders/'),
  create: (data) => request('/orders/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
};

export const cartApi = {
  getAll: () => request('/cart/'),
  create: (data) => request('/cart/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/cart/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/cart/${id}`, { method: 'DELETE' }),
};
