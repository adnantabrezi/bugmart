import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User as UserType, Product, Order } from '../types';
import { RefreshCw, Users, Package, ShoppingBag, Plus, Trash2, ShieldAlert } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'orders'>('products');

  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetMsg, setResetMsg] = useState('');

  // Add Product Form State
  const [newProductName, setNewProductName] = useState('Ab'); // BUG-026: Default length 2
  const [newPrice, setNewPrice] = useState('1999');
  const [newCategory, setNewCategory] = useState('Electronics');
  const [newStock, setNewStock] = useState('10');
  const [addMsg, setAddMsg] = useState('');

  const fetchAdminData = () => {
    if (!token) return;
    setLoading(true);

    if (activeTab === 'products') {
      fetch('/api/products?limit=50')
        .then((res) => res.json())
        .then((d) => { setProducts(d.products || []); setLoading(false); });
    } else if (activeTab === 'users') {
      fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((d) => { setUsers(Array.isArray(d) ? d : []); setLoading(false); });
    } else if (activeTab === 'orders') {
      // BUG-065: Triggers N+1 backend database queries
      fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((d) => { setOrders(Array.isArray(d) ? d : []); setLoading(false); });
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab, token]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMsg('');
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProductName,
          description: 'Classroom lab generated product entry',
          category: newCategory,
          price: parseFloat(newPrice),
          stock: parseInt(newStock),
          sku: `NEW-${Date.now()}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAddMsg(`Error: ${data.error}`);
      } else {
        setAddMsg('Product added successfully!');
        fetchAdminData();
      }
    } catch (err: any) {
      setAddMsg('Failed to add product');
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      // BUG-038: Allows CANCELLED -> PROCESSING status change
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchAdminData();
    } catch (err) {
      console.error('Status update failed');
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('Reset database to clean seeded lab state?')) return;
    setResetMsg('Resetting database and seeding products...');
    try {
      const res = await fetch('/api/admin/reset-database', { method: 'POST' });
      const data = await res.json();
      setResetMsg(data.message || 'Database reset successfully!');
      fetchAdminData();
    } catch (err) {
      setResetMsg('Database reset failed');
    }
  };

  return (
    <div className="container page-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>Admin Control Panel</h1>

        {/* Database Reset Button */}
        <button
          onClick={handleResetDatabase}
          className="btn-danger"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.9rem' }}
        >
          <RefreshCw size={16} />
          Reset Lab Database
        </button>
      </div>

      {resetMsg && (
        <div className="error-alert" style={{ background: '#e0f2fe', borderColor: '#bae6fd', color: '#0369a1', marginBottom: '20px' }}>
          {resetMsg}
        </div>
      )}

      {/* BUG-041 Notice */}
      {user?.role !== 'ADMIN' && (
        <div className="error-alert" style={{ marginBottom: '20px' }}>
          <ShieldAlert size={18} style={{ display: 'inline', marginRight: '6px' }} />
          ⚠️ BUG-041 Triggered: Accessible route guard failure — Logged in user <strong>{user?.email}</strong> is not an ADMIN.
        </div>
      )}

      {/* Admin Tabs Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('products')}
          className="btn-secondary"
          style={{ background: activeTab === 'products' ? 'var(--primary)' : undefined, color: activeTab === 'products' ? 'white' : undefined }}
        >
          <Package size={16} /> Manage Products
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className="btn-secondary"
          style={{ background: activeTab === 'users' ? 'var(--primary)' : undefined, color: activeTab === 'users' ? 'white' : undefined }}
        >
          <Users size={16} /> Registered Users
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className="btn-secondary"
          style={{ background: activeTab === 'orders' ? 'var(--primary)' : undefined, color: activeTab === 'orders' ? 'white' : undefined }}
        >
          <ShoppingBag size={16} /> All Orders (N+1 Query)
        </button>
      </div>

      {activeTab === 'products' && (
        <div>
          {/* Add Product Form */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Add New Product (Boundary Test)</h3>
            {addMsg && <p style={{ color: addMsg.startsWith('Error') ? 'var(--danger)' : 'var(--success)', fontWeight: 600, marginBottom: '12px' }}>{addMsg}</p>}

            <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Name (BUG-026: 2 or 51 chars):</label>
                <input type="text" className="form-input" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Price (₹):</label>
                <input type="number" className="form-input" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Category:</label>
                <select className="form-input" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Books">Books</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Home">Home</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Stock:</label>
                <input type="number" className="form-input" value={newStock} onChange={(e) => setNewStock(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', height: '42px' }}>
                  <Plus size={16} /> Add Product
                </button>
              </div>
            </form>
          </div>

          {/* Products List Table */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>₹{p.price.toLocaleString()}</td>
                    <td style={{ color: p.stock === 0 ? 'var(--danger)' : 'var(--text-dark)', fontWeight: p.stock === 0 ? 700 : 400 }}>
                      {p.stock} units
                    </td>
                    <td>{p.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
          <table className="cart-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, background: u.role === 'ADMIN' ? '#fee2e2' : '#f1f5f9', color: u.role === 'ADMIN' ? '#991b1b' : '#334155' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'orders' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status (BUG-038)</th>
                <th>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 700 }}>#{o.id}</td>
                  <td>{o.user?.email || `User #${o.userId}`}</td>
                  <td style={{ fontWeight: 700 }}>₹{o.totalAmount.toFixed(2)}</td>
                  <td>{o.paymentMethod}</td>
                  <td>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: o.status === 'CANCELLED' ? '#fee2e2' : '#fef3c7', color: o.status === 'CANCELLED' ? '#991b1b' : '#92400e' }}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    {/* BUG-038: Allows changing CANCELLED to PROCESSING */}
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
