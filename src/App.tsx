import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Preorder from './pages/Preorder';
import Manage from './pages/Manage';

export default function App() {
  const { pathname } = useLocation();

  return (
    <div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            TEPI.CO
          </Link>
          <nav className="nav">
            <Link to="/#menu">Menu</Link>
            <Link to="/preorder" className="btn-primary">
              Pre-Order
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/preorder" element={<Preorder />} />
          <Route path="/manage" element={<Manage />} /> {/* 👈 add this line */}
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="brand">TEPI.CO</div>
              <p className="muted">
                Fresh comfort food & drinks — made with care for UM students.
              </p>
            </div>
            <div>
              <strong>Event</strong>
              <p className="muted">
                FESKUM (UM Convocation Festival)
                <br />
                <strong>15–16 November</strong>
                <br />
                Booth 37, near KK Mart
              </p>
            </div>
            <div>
              <strong>Hours</strong>
              <p className="muted">6:00 PM – 11:00 PM</p>
              <Link to="/preorder" className="btn-outline small">
                Pre-Order Now
              </Link>
            </div>
          </div>
          <div className="tiny muted">© {new Date().getFullYear()} Tepi.Co</div>
        </div>
      </footer>

      {/* subtle sticky CTA only on home */}
      {pathname === '/' && (
        <div className="sticky-cta">
          <Link to="/preorder" className="btn-primary">
            🛒 Pre-Order for Pickup
          </Link>
        </div>
      )}
    </div>
  );
}
