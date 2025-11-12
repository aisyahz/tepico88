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

export default function Manage() {
  // ✅ Simple password protection
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const correctPassword =
  import.meta.env.VITE_ADMIN_PASS || ['tepi', 'co2025'].join('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthed(true);
      localStorage.setItem('tepi_auth', 'true');
    } else {
      alert('Incorrect password 😢');
    }
  };

  // ✅ Auto-login if already verified
  useEffect(() => {
    if (localStorage.getItem('tepi_auth') === 'true') {
      setIsAuthed(true);
    }
  }, []);

  // 🔒 If not logged in
  if (!isAuthed) {
    return (
      <section className="section">
        <div className="container narrow">
          <h1 className="section-title">🔒 Staff Login</h1>
          <p className="muted">Enter your admin password to access the management page.</p>
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

  // ✅ Proceed with order management (your original code below)
  const [orders, setOrders] = useState<PreorderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  
    const setupRealtime = async () => {
      const channel = supabase
        .channel('preorders-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'preorders' },
          (payload) => {
            console.log('🆕 New order', payload.new);
            loadOrders();
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
        .subscribe();
  
      // Cleanup on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    };
  
    // call setup without making useEffect itself async
    setupRealtime();
  
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  

  async function loadOrders() {
    const { data } = await supabase
      .from('preorders')
      .select('*, menu_items(*)')
      .order('created_at', { ascending: false });
    setOrders((data as PreorderRow[]) || []);
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

  function SalesSummary({ orders, target }: { orders: any[]; target: number }) {
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
          <strong>RM{totalSales.toFixed(2)}</strong> / RM{target.toFixed(2)} (
          {percent}%)
        </p>
      </div>
    );
  }

  return (
    <section className="section">
      <div className="container wide">
        <h1 className="section-title">🍽 Order Management</h1>
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
