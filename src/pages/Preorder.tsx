import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import '../preorder.css';

type MenuItem = {
  id: number;
  name: string;
  price: number | null;
  category: string;
  description?: string | null;
};

type PreorderRow = {
  id: number;
  customer_name: string;
  menu_id: number | null;
  quantity: number;
  status: string;
  created_at: string;
  pickup_time?: string | null;
  menu_items?: MenuItem;
};

type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
};

type ReceiptData = {
  customerName: string;
  pickupTime?: string;
  items: ReceiptItem[];
  total: number;
  orderId: string;
  createdAt: string;
};

const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  'Spaghetti Alfredo Chicken':
    'Creamy white sauce pasta with grilled chicken – UM favourite. 🤍',
  'Popia Ramen Cheezy (4 pcs)':
    'Crispy popia stuffed with ramen & cheese. Crunch + cheesy pull. 😋',
  Croissant:
    'Buttery croissant with Hershey’s drizzle & whipped cream. Perfect with drinks.',
};

const CATEGORY_LABELS: Record<string, string> = {
  Food: '🍝 Food',
  Drink: '🧋 Drinks',
  Dessert: '🥐 Dessert',
  Combo: '🍱 Combos',
};

export default function Preorder() {
  const [name, setName] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{ id: number; qty: number }[]>([]);
  const [orders, setOrders] = useState<PreorderRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Load menu + orders + realtime
  useEffect(() => {
    void loadMenu();
    void loadOrders();

    const ch = supabase
      .channel('public:preorders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'preorders' },
        (payload) =>
          setOrders((prev) => [payload.new as PreorderRow, ...prev])
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
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

  function getQty(id: number) {
    return cart.find((c) => c.id === id)?.qty || 0;
  }

  function incrementQty(id: number) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) {
        return prev.map((c) =>
          c.id === id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { id, qty: 1 }];
    });
  }

  function decrementQty(id: number) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (!existing) return prev;
      if (existing.qty <= 1) {
        return prev.filter((c) => c.id !== id);
      }
      return prev.map((c) =>
        c.id === id ? { ...c, qty: c.qty - 1 } : c
      );
    });
  }

  const total = cart.reduce((sum, c) => {
    const item = menu.find((m) => m.id === c.id);
    return sum + (item?.price || 0) * c.qty;
  }, 0);

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);

  async function submitOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim() || cart.length === 0) {
      alert('Please enter your name and select at least one item.');
      return;
    }

    if (!pickupTime.trim()) {
      alert('Please choose your pickup time.');
      return;
    }

    setLoading(true);

    try {
      const payloads = cart.map((c) => ({
        customer_name: name.trim(),
        menu_id: c.id,
        quantity: c.qty,
        pickup_time: pickupTime,
      }));

      const { error } = await supabase.from('preorders').insert(payloads);

      if (error) {
        alert('❌ Failed to submit order: ' + error.message);
        return;
      }

      // Build receipt BEFORE clearing state
      const receiptItems: ReceiptItem[] = cart.map((c) => {
        const item = menu.find((m) => m.id === c.id);
        return {
          name: item?.name || 'Item',
          qty: c.qty,
          price: item?.price || 0,
        };
      });

      const orderId = 'TP' + Date.now().toString().slice(-6);
      const createdAt = new Date().toLocaleString('en-MY', {
        hour12: true,
      });

      setReceipt({
        customerName: name.trim(),
        pickupTime,
        items: receiptItems,
        total,
        orderId,
        createdAt,
      });
      setShowReceipt(true);

      // Reset fields
      setName('');
      setPickupTime('');
      setCart([]);
      void loadOrders();
    } finally {
      setLoading(false);
    }
  }

  const categoriesInMenu = Array.from(
    new Set(menu.map((m) => m.category))
  );

  const itemsByCategory = (cat: string) =>
    menu.filter((m) => m.category === cat);

  return (
    <section className="section preorder-page">
      <div className="container narrow">
        <h1 className="section-title">Pre-Order for Pickup</h1>
        <p className="muted">
          Choose your food, set your pickup time, and{" "}
          <strong>pay by QR at the counter</strong>.  
          After submitting, <strong>please screenshot your receipt</strong> and show it to us 😸
        </p>

        <form className="card preorder-form" onSubmit={submitOrder}>
          <div className="field">
            <label>Your Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. Aisyah / Group C1"
            />
          </div>

          <div className="field">
            <label>Pickup Time</label>
            <input
              type="time"
              className="input"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
            />
            <p className="tiny muted">
              Example: 22:45 (10:45 PM). Please choose between 20:00 – 23:30.
            </p>
          </div>

          <div className="field">
            <label>Select Menu Items</label>

            {categoriesInMenu.map((cat) => (
              <div className="menu-section" key={cat}>
                <h3 className="menu-section-title">
                  {CATEGORY_LABELS[cat] || cat}
                </h3>
                <div className="menu-list">
                  {itemsByCategory(cat).map((m) => {
                    const qty = getQty(m.id);
                    const desc =
                      m.description ||
                      FALLBACK_DESCRIPTIONS[m.name] ||
                      '';

                    return (
                      <div
                        key={m.id}
                        className={`menu-option ${
                          qty > 0 ? 'selected' : ''
                        }`}
                      >
                        <div className="menu-option-info">
                          <div className="menu-option-main">
                            <div>
                              <strong>{m.name}</strong>
                            </div>
                            <div className="menu-option-price">
                              RM{Number(m.price || 0).toFixed(2)}
                            </div>
                          </div>

                          {desc && (
                            <p className="tiny muted menu-option-desc">
                              {desc}
                            </p>
                          )}

                          <div className="menu-option-footer">
                            <span className="tiny muted">
                              {m.category}
                            </span>
                            <div className="qty-controls">
                              {qty === 0 ? (
                                <button
                                  type="button"
                                  className="qty-btn add"
                                  onClick={() => incrementQty(m.id)}
                                >
                                  + Add
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="qty-btn"
                                    onClick={() => decrementQty(m.id)}
                                  >
                                    –
                                  </button>
                                  <span className="qty-display">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    className="qty-btn"
                                    onClick={() => incrementQty(m.id)}
                                  >
                                    +
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {itemsByCategory(cat).length === 0 && (
                    <div className="muted tiny">
                      No items in this category yet.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="field total">
            <strong>Total:</strong> RM{total.toFixed(2)}{' '}
            <span className="tiny muted">
              ({totalItems} item{totalItems !== 1 ? 's' : ''})
            </span>
          </div>

          <button
            className="btn-primary full"
            disabled={loading || cart.length === 0}
          >
            {loading ? 'Submitting…' : 'Submit Pre-Order'}
          </button>
          <p className="tiny muted center">
            After submitting, a cute receipt will pop up 🧾😹  
            <strong>Please screenshot and show at the counter.</strong>
          </p>
        </form>

        <div className="spacer" />

        <h2 className="section-subtitle">Live Orders</h2>
        <div className="card">
          {orders.length === 0 && (
            <div className="muted">No orders yet.</div>
          )}
          {orders.map((o) => (
            <div className="order-row" key={o.id}>
              <div>
                <strong>{o.customer_name}</strong> — {o.quantity}×{' '}
                {o.menu_items?.name || 'Item'}
                <div className="tiny muted">
                  {new Date(o.created_at).toLocaleString()} • Status:{' '}
                  {o.status}
                  {o.pickup_time && (
                    <>
                      {' '}
                      • Pickup: <strong>{o.pickup_time}</strong>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating cart bar */}
      {totalItems > 0 && (
        <div className="preorder-cart-bar">
          <div>
            <div className="cart-bar-line">
              {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
            </div>
            <div className="cart-bar-sub">
              Total: RM{total.toFixed(2)}
            </div>
          </div>
          <button
            className="btn-primary cart-bar-btn"
            onClick={() => {
              const form = document.querySelector(
                '.preorder-form'
              ) as HTMLFormElement | null;
              if (form) {
                form.requestSubmit();
              }
            }}
          >
            Submit & Get Receipt
          </button>
        </div>
      )}

      {/* Receipt modal */}
      {showReceipt && receipt && (
        <div className="receipt-backdrop">
          <div className="receipt-modal">
            <div className="receipt-header">
              <h2>Tepi.Co Order Receipt</h2>
              <p className="tiny muted">
                Please screenshot this page & show at the counter 💛
              </p>
            </div>

            <div className="receipt-body">
              <div className="receipt-left">
                <p>
                  Name: <strong>{receipt.customerName}</strong>
                </p>
                {receipt.pickupTime && (
                  <p>
                    Pickup Time:{' '}
                    <strong>{receipt.pickupTime}</strong>
                  </p>
                )}
                <p className="tiny muted">
                  Order ID: <strong>{receipt.orderId}</strong> •{' '}
                  {receipt.createdAt}
                </p>

                <div className="receipt-items">
                  {receipt.items.map((item, idx) => (
                    <div className="receipt-item" key={idx}>
                      <div>
                        {item.qty}× {item.name}
                      </div>
                      <div>
                        RM{(item.price * item.qty).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="receipt-total">
                  <span>Total</span>
                  <strong>RM{receipt.total.toFixed(2)}</strong>
                </div>
              </div>

              <div className="receipt-right">
                <div className="cat-circle">
                  {/* Replace with your own cute GIF if you want */}
                  <img
                    src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVmcW5oMHcwMGduZmx3cWU1MHQzZnU5ZzhkYzVwa202cWt1eW9nYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/O6YlvJ4ZfCxzS9T3Al/giphy.gif"
                    alt="Cute chef cat"
                  />
                </div>
                <p className="tiny muted center">
                  Chef Kucing is cooking your order…  
                  Thank you for supporting Tepi.Co 😺
                </p>
              </div>
            </div>

            <button
              className="btn-secondary full"
              onClick={() => setShowReceipt(false)}
            >
              Done (I’ve screenshot this)
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
