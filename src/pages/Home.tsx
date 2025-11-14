import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import useScrollReveal from "../hooks/useScrollReveal";
import "../home.css";

type MenuItem = {
  id: number;
  category: string;
  name: string;
  price: number | null;
  description?: string | null;
  img_url?: string | null;
};

export default function Home() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cute fallback cat images 🐱
  const fallbackImages = {
    food: "https://i.pinimg.com/736x/8f/b1/12/8fb1129b6affa52c8fc0f20fe25d4a4e.jpg",
    drink: "https://i.pinimg.com/736x/bd/4c/1b/bd4c1b9e6dc57d2792134e8f1037a4fe.jpg",
    combo: "https://i.pinimg.com/736x/5f/60/7e/5f607eab34bd83fae3f5aca3fd5f6f07.jpg",
  };

  useScrollReveal();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      setMenu((data as MenuItem[]) || []);
      setLoading(false);
    })();
  }, []);

  // detect center item in mobile carousel
  useEffect(() => {
    const track = document.querySelector(".carousel-track") as HTMLElement | null;
    if (!track) return;

    const handleScroll = () => {
      const items = track.querySelectorAll(".carousel-item") as NodeListOf<HTMLElement>;
      let centerX = track.scrollLeft + track.clientWidth / 2;

      items.forEach((item) => {
        const r = item.getBoundingClientRect();
        const itemCenter = r.left + r.width / 2;
        const distance = Math.abs(itemCenter - centerX);

        if (distance < r.width / 2) item.classList.add("active");
        else item.classList.remove("active");
      });
    };

    track.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => track.removeEventListener("scroll", handleScroll);
  }, []);

  const byCat = (cat: string) => menu.filter((m) => m.category === cat);

  const getImg = (item: MenuItem) => {
    if (item.img_url) return item.img_url;
    if (item.category === "Food") return fallbackImages.food;
    if (item.category === "Drink") return fallbackImages.drink;
    return fallbackImages.combo;
  };

  // SUPABASE IMAGE LIST
  const galleryImages = [
    { url: "https://xqlmlviqovsaqrypgpmo.supabase.co/storage/v1/object/public/menu/Pasta.jpeg", label: "Spaghetti Alfredo Chicken" },
    { url: "https://xqlmlviqovsaqrypgpmo.supabase.co/storage/v1/object/public/menu/Popia.jpeg", label: "Popia Ramen Cheezy" },
    { url: "https://xqlmlviqovsaqrypgpmo.supabase.co/storage/v1/object/public/menu/Croissant2.jpeg", label: "Buttery Croissant" },
    { url: "https://xqlmlviqovsaqrypgpmo.supabase.co/storage/v1/object/public/menu/ComboPasta.jpeg", label: "Combo Pasta + Drink" },
    { url: "https://xqlmlviqovsaqrypgpmo.supabase.co/storage/v1/object/public/menu/ComboNasiAir.jpeg", label: "Combo Nasi Lemak + Drink" },
    { url: "https://xqlmlviqovsaqrypgpmo.supabase.co/storage/v1/object/public/menu/Drinks.jpeg", label: "House Drinks" }
  ];

  return (
    <>
      {/* 🐱 Floating Chef Cat */}
      <img
        src="https://clipart-library.com/images/yikrG4GbT.gif"
        className="floating-cat"
        alt="Chef Cat"
      />

      {/* Background Cat Avatar */}
      <img
        src="https://images.unsplash.com/vector-1756550631103-d5308a9d3e2c?w=600&auto=format&fit=crop&q=60"
        className="bg-avatar"
        alt="cat background"
      />

      {/* HERO */}
      <section className="hero-simple">
        <div className="hero-content">
          <h1 className="hero-title">Tepi.Co @ FESKUM 🎓</h1>
          <p className="hero-sub">Comfort food & croissants made fresh 💛</p>

          <div className="hero-buttons">
            <a href="#menu" className="btn-cream-outline">View Menu</a>
            <a href="/preorder" className="btn-cream">Pre-Order</a>
          </div>

          <p className="hero-event">📍 Booth 37 • 15–16 Nov • 6 PM – 11 PM</p>
        </div>
      </section>

      {/* FEATURED GALLERY */}
      <section className="section center featured-gallery">
        <div className="container">
          <h2 className="section-title">Featured Items 🍽️</h2>
          <p className="muted big">Our favourites — freshly made with love.</p>

          <div className="gallery-wrapper">

            {/* Desktop Grid */}
            <div className="gallery-grid desktop-only">
              {galleryImages.map((item, i) => (
                <div className="gallery-card" key={i}>
                  <div className="img-wrap">
                    <img src={item.url} alt={item.label} />
                    <img
                      className="watermark"
                      src="https://i.postimg.cc/MGmZ7vZV/catpaw.png"
                      alt="paw"
                    />
                  </div>
                  <div className="gallery-label">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Mobile Carousel */}
            <div className="carousel mobile-only">
              <div className="carousel-track">
                {galleryImages.map((item, i) => (
                  <div className="carousel-item" key={i}>
                    <img src={item.url} alt={item.label} />
                    <div className="gallery-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MENU SECTION */}
      <section id="menu" className="section menu-area">
        <div className="container">
          <h2 className="section-title center">Our Menu</h2>

          {["Food", "Drink", "Combo"].map((cat) => (
            <div key={cat}>
              <h3 className="menu-cat">
                {cat === "Food" && "🍝 Food"}
                {cat === "Drink" && "🧋 Drinks"}
                {cat === "Combo" && "🍱 Combo Sets"}
              </h3>

              <div className="menu-grid">
                {loading && <div className="muted tiny">Loading…</div>}

                {byCat(cat).map((i) => (
                  <div className="menu-card" key={i.id}>
                    <img className="menu-img" src={getImg(i)} alt={i.name} />
                    <div className="menu-name">{i.name}</div>
                    <div className="menu-desc">{i.description || "Fresh & tasty."}</div>
                    <div className="menu-price">
                      RM{Number(i.price || 0).toFixed(2)}
                    </div>
                  </div>
                ))}

                {byCat(cat).length === 0 && !loading && (
                  <div className="muted tiny">No items yet.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="section soft center">
        <div className="container">
          <h2 className="section-title">About Tepi.Co</h2>
          <p className="muted big">
            Affordable, fresh & cozy — made with love by UM students 🤍
          </p>
        </div>
      </section>

      {/* SOCIAL */}
      <section className="section soft center">
        <div className="container">
          <h2 className="section-title">Follow Us</h2>
          <p className="muted">Booth updates, menu drops & cute content 👇</p>

          <div className="social-links">
            <a href="https://instagram.com/tepi.co88" target="_blank" className="social-btn">
              📸 Instagram
            </a>
            <a href="https://tiktok.com/@tepico88" target="_blank" className="social-btn">
              🎥 TikTok
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
