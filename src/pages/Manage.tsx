import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

type MenuItem = {
  id: number;
  name: string;
  price: number | null;
};

type PreorderRow = {
  id: number;
  customer_name: string;
  menu_id: number | null;
  quantity: number;
  status: string;
  created_at: string;
  menu_items?: MenuItem;
};

// ✅ Define outside main component
function SalesSummary({ orders, target }: { orders: PreorderRow[]; target: number }) {
  const completedOrders = orders.filter(
    (o) => o.status === 'ready' || o.status === 'collected'
  );
  const totalSales = completedOrders.reduce((sum, o) => {
    const price = o.menu_items?.price || 0;
    return sum + price * o.quantity;
  }, 0);
  const percent = Math.min((totalSales / target) * 100, 100).toFixed(1);
  return (
    <div className="sales-summary card">
      <h3>🎯 Target Sales Progress</h3>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percent}%` }}></div>
      </div>
      <p>
        <strong>RM{totalSales.toFixed(2)}</strong> / RM{target.toFixed(2)} ({percent}%)
      </p>
      <p className="tiny muted">
        Keep it up! You need RM{Math.max(target - totalSales, 0).toFixed(2)} more 💪
      </p>
    </div>
  );
}

export default function Manage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const correctPassword =
    (window as any)._env_?.VITE_ADMIN_PASS || 'tepico2025';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthed(true);
      localStorage.setItem('tepi_auth', 'true');
    } else {
      alert('Incorrect password 😢');
    }
  };

  const handleLogout = () => {
    setIsAuthed(false);
    localStorage.removeItem('tepi_auth');
  };

  useEffect(() => {
    if (localStorage.getItem('tepi_auth') === 'true') {
      setIsAuthed(true);
    }
  }, []);

  if (!isAuthed) {
    return (
      <section className="section">
        <div className="container narrow">
          <h1 className="section-title">🔒 Staff Login</h1>
          <p className="muted">
            Enter your admin password to access the management page.
          </p>
          <form onSubmit={handleLogin} className="card">
            <input
              type="password"
              placeholder="Enter password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="btn-primary full">Login</button>
          </form>
        </div>
      </section>
    );
  }

  const [orders, setOrders] = useState<PreorderRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIXED useEffect — not async anymore
  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel('preorders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'preorders' },
        (payload) => {
          console.log('🆕 New order', payload.new);
          setOrders((prev) => [payload.new as PreorderRow, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'preorders' },
        (payload) => {
          console.log('🔄 Order updated', payload.new);
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id ? (payload.new as PreorderRow) : o
            )
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'preorders' },
        (payload) => {
          console.log('❌ Order deleted', payload.old);
          setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
        }
      )
      .subscribe();

    // ✅ Proper cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadOrders() {
    const { data, error } = await supabase
      .from('preorders')
      .select('*, menu_items(*)')
      .order('created_at', { ascending: false });
    if (!error) setOrders((data as PreorderRow[]) || []);
    setLoading(false);
  }

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from('preorders')
      .update({ status })
      .eq('id', id);
    if (error) alert('Failed to update: ' + error.message);
    else loadOrders();
  }

  return (
    <section className="section">
      <div className="container wide">
        <div className="flex-space-between">
          <h1 className="section-title">🍽 Order Management</h1>
          <button className="btn-outline small" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <p className="muted">Mark orders as Preparing, Ready, or Collected.</p>
        <SalesSummary orders={orders} target={500} />

        {loading && <div className="muted">Loading orders…</div>}
        {!loading && orders.length === 0 && <div className="muted">No orders yet.</div>}

        {orders.map((o) => (
          <div className="card order-manage" key={o.id}>
            <div className="order-info">
              <strong>{o.customer_name}</strong> — {o.quantity}×{' '}
              {o.menu_items?.name || 'Item'}
              <div className="tiny muted">
                {new Date(o.created_at).toLocaleString()}
              </div>
            </div>
            <div className="order-actions">
              {['pending', 'preparing', 'ready', 'collected'].map((s) => (
                <button
                  key={s}
                  className={`status-btn ${o.status === s ? 'active' : ''}`}
                  onClick={() => updateStatus(o.id, s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
