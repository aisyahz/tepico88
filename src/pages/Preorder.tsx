import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

type MenuItem = {
  id: number;
  name: string;
  price: number | null;
  category: string;
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

export default function Preorder() {
  const [name, setName] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{ id: number; qty: number }[]>([]);
  const [orders, setOrders] = useState<PreorderRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMenu();
    loadOrders();

    const ch = supabase
      .channel('public:preorders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'preorders' },
        (payload) => setOrders((prev) => [payload.new as PreorderRow, ...prev])
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  async function loadMenu() {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    setMenu((data as MenuItem[]) || []);
  }

  async function loadOrders() {
    const { data } = await supabase
      .from('preorders')
      .select('*, menu_items(*)')
      .order('created_at', { ascending: false });
    setOrders((data as PreorderRow[]) || []);
  }

  function toggleItem(id: number) {
    setCart((prev) =>
      prev.some((x) => x.id === id)
        ? prev.filter((x) => x.id !== id)
        : [...prev, { id, qty: 1 }]
    );
  }

  function updateQty(id: number, qty: number) {
    setCart((prev) => prev.map((x) => (x.id === id ? { ...x, qty } : x)));
  }

  const total = cart.reduce((sum, c) => {
    const item = menu.find((m) => m.id === c.id);
    return sum + (item?.price || 0) * c.qty;
  }, 0);

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || cart.length === 0) {
      alert('Please enter your name and select at least one item.');
      return;
    }

    setLoading(true);

    try {
      const payloads = cart.map((c) => ({
        customer_name: name.trim(),
        menu_id: c.id,
        quantity: c.qty,
      }));

      const { error } = await supabase.from('preorders').insert(payloads);

      if (error) {
        alert('❌ Failed to submit order: ' + error.message);
      } else {
        // Success feedback
        const successEl = document.createElement('div');
        successEl.className = 'toast-success';
        successEl.textContent = '🎉 Order submitted successfully!';
        document.body.appendChild(successEl);
        setTimeout(() => successEl.remove(), 2500);

        // Reset fields
        setName('');
        setCart([]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="container narrow">
        <h1 className="section-title">Pre-Order for Pickup</h1>
        <p className="muted">
          Choose multiple items, we’ll prepare them fresh. Pay by QR during
          pickup.
        </p>

        <form className="card" onSubmit={submitOrder}>
          <div className="field">
            <label>Your Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Select Menu Items</label>
            <div className="menu-list">
              {menu.map((m) => {
                const selected = cart.find((c) => c.id === m.id);
                return (
                  <div
                    key={m.id}
                    className={`menu-option ${selected ? 'selected' : ''}`}
                    onClick={() => toggleItem(m.id)}
                  >
                    <div>
                      <strong>{m.name}</strong>{' '}
                      <span className="muted">({m.category})</span>
                    </div>
                    <div>
                      RM{Number(m.price || 0).toFixed(2)}
                      {selected && (
                        <input
                          type="number"
                          min={1}
                          value={selected.qty}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateQty(m.id, parseInt(e.target.value) || 1)
                          }
                          className="qty-input"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="field total">
            <strong>Total:</strong> RM{total.toFixed(2)}
          </div>

          <button className="btn-primary full" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Pre-Order'}
          </button>
        </form>

        <div className="spacer" />

        <h2 className="section-subtitle">Live Orders</h2>
        <div className="card">
          {orders.length === 0 && <div className="muted">No orders yet.</div>}
          {orders.map((o) => (
            <div className="order-row" key={o.id}>
              <div>
                <strong>{o.customer_name}</strong> — {o.quantity}×{' '}
                {o.menu_items?.name || 'Item'}
                <div className="tiny muted">
                  {new Date(o.created_at).toLocaleString()} • Status: {o.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
