import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import useScrollReveal from '../hooks/useScrollReveal';

type MenuItem = {
  id: number;
  category: string; // 'Food' | 'Drink' | 'Combo'
  name: string;
  price: number | null;
  description?: string | null;
};

const drinkImg =
  'https://images.pexels.com/photos/8679422/pexels-photo-8679422.jpeg';

export default function Home() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  useScrollReveal();
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      setMenu((data as MenuItem[]) || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const slides = document.querySelectorAll<HTMLImageElement>('.hero-slide');
      slides.forEach((slide) => {
        slide.style.transform = `translateY(${scrollY * 0.2}px) scale(1.2)`; // gentle parallax shift
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const byCat = (cat: string) => menu.filter((m) => m.category === cat);

  return (
    <>
      <section className="hero">
        <div className="hero-slides">
          {/* list of hero images */}
          {[
            'https://images.pexels.com/photos/15115648/pexels-photo-15115648.jpeg?auto=compress&cs=tinysrgb&w=1600',
            'https://images.pexels.com/photos/31269836/pexels-photo-31269836.jpeg',
            'https://images.pexels.com/photos/34634299/pexels-photo-34634299.jpeg',
            'https://imagetourl.net/image/737d396d-ba9d-480e-bf2e-f721bf7273ee',
            'https://files.imagetourl.net/uploads/1762929970460-63b08034-a18d-4b58-965a-d9ea73bba923.png',
          ].map((url, i) => (
            <img key={i} src={url} alt="Tepi.Co food" className="hero-slide" />
          ))}
        </div>

        <div className="hero-overlay">
          <div className="container hero-inner">
            <div className="hero-text">
              <h1>Tepi.Co @ FESKUM 🍝</h1>
              <p className="muted big">
                Delicious comfort food & drinks for UM — Spaghetti Alfredo,
                Ramen Popia Cheezy, Croissants & more!
              </p>
              <div className="actions">
                <a href="#menu" className="btn-outline big">
                  View Menu
                </a>
                <a href="/preorder" className="btn-primary big">
                  Pre-Order Now
                </a>
              </div>
              <div className="event-pill">
                📍 Booth 37 • 15–16 Nov • 6 PM – 11 PM • Near KK Mart
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="event-reminder">
        🎉 Only a few days left till FESKUM 2025! Catch us at{' '}
        <strong>Booth 37</strong> near KK Mart — Nov 15–16 🍝🧋
      </div>

      {/* MENU PREVIEW */}
      <section id="menu" className="section">
        <div className="container">
          <h2 className="section-title">Our Menu</h2>

          <h3 className="category">🍝 Food</h3>
          {loading ? (
            <div className="skeleton-row">Loading menu…</div>
          ) : (
            <div className="card-grid">
              {byCat('Food').map((i) => (
                <article className="card card-menu" key={i.id}>
                  <div className="card-body">
                    <div className="card-title">{i.name}</div>
                    <div className="muted">{i.description || ' '}</div>
                    <div className="price">
                      RM{Number(i.price || 0).toFixed(2)}
                    </div>
                    <a href="/preorder" className="btn-small">
                      Order
                    </a>
                  </div>
                </article>
              ))}
              {byCat('Food').length === 0 && (
                <div className="muted">No items yet.</div>
              )}
            </div>
          )}
          <h3 className="category">⭐ Best Sellers</h3>
          <div className="card-grid">
            <article className="card card-menu">
              <div className="card-body">
                <div className="card-title">Spaghetti Alfredo Chicken</div>
                <div className="muted">
                  Creamy, comforting, and UM crowd favorite.
                </div>
                <div className="price">RM12.00</div>
              </div>
            </article>
            <article className="card card-menu">
              <div className="card-body">
                <div className="card-title">Popia Ramen Cheezy (4 pcs)</div>
                <div className="muted">
                  Crispy on the outside, cheesy on the inside 😋
                </div>
                <div className="price">RM10.00</div>
              </div>
            </article>
          </div>

          <h3 className="category">🧋 Drinks</h3>
          {loading ? (
            <div className="skeleton-row">Loading menu…</div>
          ) : (
            <div className="card-grid">
              {byCat('Drink').map((i) => (
                <article className="card card-menu" key={i.id}>
                  <div className="card-body">
                    <div className="card-title">{i.name}</div>
                    <div className="muted">{i.description || ' '}</div>
                    <div className="price">
                      RM{Number(i.price || 0).toFixed(2)}
                    </div>
                    <a href="/preorder" className="btn-small">
                      Order
                    </a>
                  </div>
                </article>
              ))}
              {byCat('Drink').length === 0 && (
                <div className="muted">No items yet.</div>
              )}
            </div>
          )}

          <div className="promo-banner">
            <img src={drinkImg} alt="Refreshing drinks" />
            <div className="promo-text">
              <div className="promo-kicker">Combo Deals</div>
              <div className="promo-title">Save with Sets A, B & C</div>
              <div className="promo-desc">
                Perfect for lepak with friends — bundle food + drinks, jimat &
                cepat.
              </div>
              <a href="https://tepico88.netlify.app/preorder" className="btn-outline">
                Order a Combo
              </a>
            </div>
          </div>

          <h3 className="category">🍱 Combos</h3>
          {!loading && (
            <div className="card-grid">
              {byCat('Combo').map((i) => (
                <article className="card card-menu" key={i.id}>
                  <div className="card-body">
                    <div className="card-title">{i.name}</div>
                    <div className="muted">{i.description || ' '}</div>
                    <div className="price">
                      RM{Number(i.price || 0).toFixed(2)}
                    </div>
                    <a href="/preorder" className="btn-small">
                      Order
                    </a>
                  </div>
                </article>
              ))}
              {byCat('Combo').length === 0 && (
                <div className="muted">No combo items yet.</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ABOUT / TRUST */}
      <section className="section soft">
        <div className="container trust">
          <div>
            <h3>Why Tepi.Co?</h3>
            <ul className="tick">
              <li>Freshly prepared on the spot</li>
              <li>Student-friendly pricing</li>
              <li>Fast pickup via pre-order</li>
            </ul>
          </div>

          <div>
            <h3>Location</h3>
            <p className="muted">
              Universiti Malaya — FESKUM 2025 🎓
              <br />
              Booth 37 (near KK Mart) | 15–16 Nov | 6–11 PM
            </p>
            <p className="muted">
              Come lepak at our booth — we’ll play calm music 🎶, serve good
              food, and give good vibes. Bring your friends! No outside food
              allowed 😆 Please collect and throw your rubbish properly — like a
              true <strong>UM Top 1 student 🏆</strong>.
            </p>

            {/* 📍 Embedded Google Map */}
            <div className="map-wrapper">
              <h3>📍 How to Find Us</h3>
              <p className="muted">
                We’re right beside <strong>KK Mart UM (LY)</strong> — Booth 37
                during FESKUM 2025. Come lepak, enjoy calm music 🎶, and grab
                fresh comfort food. Bring your friends, keep the place clean
                (like UM Top 1 students 🏆)!
              </p>

              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.8998332568563!2d101.65297237479614!3d3.1211893968543376!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc4982c8ad1c81%3A0xf00abd581f3b4b2a!2sKK%20Concept%20Store%20Universiti%20Malaya%20(UMLY)!5e0!3m2!1sen!2smy!4v1762931318233!5m2!1sen!2smy"
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: '10px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Tepi.Co FESKUM Booth Map"
              ></iframe>
            </div>
          </div>

          <div>
            <h3>Contact</h3>
            <p className="muted">
              📞 <a href="tel:0136648159">013-664 8159</a>
              <br />
              or DM us on Instagram:{' '}
              <a href="https://instagram.com/tepi.co" target="_blank">
                @tepi.co
              </a>
            </p>
            <p className="muted">
              We’ll reply fast — especially if you bring your hungry friends 😋
            </p>
          </div>
        </div>
      </section>
      <section className="section soft">
        <div className="container">
          <h2 className="section-title">About Tepi.Co</h2>
          <p className="muted">
            Started by an alumni UM students with Friends who love late-night
            food and good company 🍴 Tepi.Co brings affordable comfort meals to
            campus, made with love and laughter. Whether you're rushing between
            convocation events or chilling with friends, drop by — we’ll make
            sure you leave full and happy ❤️
          </p>
        </div>
      </section>
      {/* SOCIAL MEDIA SECTION */}
      <section className="section soft">
        <div className="container">
          <h2 className="section-title">🎬 Follow Tepi.Co Online</h2>
          <p className="muted center">
            See our booth moments, behind-the-scenes clips, and student
            reactions! Follow us on <strong>TikTok</strong> &{' '}
            <strong>Instagram</strong> 💛
          </p>

          <div className="social-embed-grid">
            {/* TikTok Profile */}
            <blockquote
              className="tiktok-embed"
              cite="https://www.tiktok.com/@tepico88"
              data-unique-id="tepico88"
              data-embed-type="creator"
              style={{ maxWidth: '400px', minWidth: '280px' }}
            >
              <section>
                <a target="_blank" href="https://www.tiktok.com/@tepico88">
                  @tepico88 on TikTok
                </a>
              </section>
            </blockquote>

            {/* Instagram Profile */}
            <blockquote
              className="instagram-media"
              data-instgrm-permalink="https://www.instagram.com/tepi.co88"
              data-instgrm-version="14"
              style={{
                background: '#fff',
                border: 0,
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                margin: '10px auto',
                maxWidth: '400px',
              }}
            ></blockquote>

            {/* Scripts */}
            <script async src="https://www.tiktok.com/embed.js"></script>
            <script async src="//www.instagram.com/embed.js"></script>
          </div>

          <div className="social-links">
            <a
              href="https://www.instagram.com/tepi.co88"
              target="_blank"
              rel="noopener noreferrer"
            >
              📸 Instagram
            </a>
            <a
              href="https://www.tiktok.com/@tepico88"
              target="_blank"
              rel="noopener noreferrer"
            >
              🎥 TikTok
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
