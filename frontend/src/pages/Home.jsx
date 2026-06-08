import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { useCart } from '../context/CartContext'
import './Home.css'

const CATEGORIES = [
  { id: 1, name: 'Electronics', emoji: '💻', color: '#3b82f6' },
  { id: 2, name: 'Clothing',    emoji: '👕', color: '#8b5cf6' },
  { id: 3, name: 'Food & Drinks', emoji: '☕', color: '#f59e0b' },
  { id: 4, name: 'Books',       emoji: '📚', color: '#10b981' },
  { id: 5, name: 'Home & Garden', emoji: '🌿', color: '#ef4444' },
]

const HERO_SLIDES = [
  { headline: 'Summer Sale', sub: 'Up to 40% off Electronics', cta: 'Shop Electronics', link: '/products?category_id=1', bg: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', emoji: '💻' },
  { headline: 'Fresh Arrivals', sub: 'New Clothing just dropped', cta: 'Explore Fashion', link: '/products?category_id=2', bg: 'linear-gradient(135deg,#4c1d95,#8b5cf6)', emoji: '👕' },
  { headline: 'Gourmet Picks', sub: 'Premium Food & Drinks', cta: 'Browse Food', link: '/products?category_id=3', bg: 'linear-gradient(135deg,#92400e,#f59e0b)', emoji: '☕' },
  { headline: 'Read More', sub: 'Bestselling Books on sale', cta: 'See Books', link: '/products?category_id=4', bg: 'linear-gradient(135deg,#064e3b,#10b981)', emoji: '📚' },
]

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [slide, setSlide] = useState(0)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [addedId, setAddedId] = useState(null)
  const canvasRef = useRef(null)
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const cardsPerView = 4

  useEffect(() => {
    Promise.all([
      api.get('/products/featured'),
      api.get('/products'),
    ]).then(([feat, all]) => {
      setFeatured(Array.isArray(feat) ? feat : [])
      const items = Array.isArray(all) ? all : (all?.data || [])
      setAllProducts(items)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Auto-advance hero
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 4000)
    return () => clearInterval(t)
  }, [])

  // Canvas promo banner
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let frame = 0
    let raf
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0)
      const offset = (Math.sin(frame / 60) + 1) / 2
      grad.addColorStop(0, `hsl(${220 + offset * 40},80%,45%)`)
      grad.addColorStop(0.5, `hsl(${40 + offset * 20},90%,50%)`)
      grad.addColorStop(1, `hsl(${340 + offset * 20},80%,55%)`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // Sparkles
      for (let i = 0; i < 8; i++) {
        const x = ((i * 90 + frame * 0.5) % canvas.width)
        const y = canvas.height / 2 + Math.sin(frame / 20 + i) * 10
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.fill()
      }
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 22px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0,0,0,0.4)'
      ctx.shadowBlur = 8
      ctx.fillText('🔥 LIMITED TIME SALE — Up to 40% OFF! Use code SAVE20', canvas.width / 2, canvas.height / 2)
      frame++
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleAddToCart = useCallback(async (product) => {
    await addToCart(product, 1)
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1500)
  }, [addToCart])

  const prevCarousel = () => setCarouselIndex(i => Math.max(0, i - 1))
  const nextCarousel = () => setCarouselIndex(i => Math.min(allProducts.length - cardsPerView, i + 1))

  const visibleProducts = allProducts.slice(carouselIndex, carouselIndex + cardsPerView)

  return (
    <div className="home-page">

      {/* ── Hero Slider ── */}
      <section className="hero-slider" aria-label="Hero banner" data-testid="hero-section">
        {HERO_SLIDES.map((s, i) => (
          <div
            key={i}
            className={`hero-slide${i === slide ? ' active' : ''}`}
            style={{ background: s.bg }}
            aria-hidden={i !== slide}
          >
            <div className="hero-text">
              <span className="hero-emoji">{s.emoji}</span>
              <h1>{s.headline}</h1>
              <p>{s.sub}</p>
              <Link to={s.link} className="btn hero-cta" data-testid="hero-shop-now-btn">{s.cta} →</Link>
            </div>
            <div className="hero-visual">
              <div className="hero-badge">SALE<br/><span>40% OFF</span></div>
            </div>
          </div>
        ))}
        <div className="slide-dots" role="tablist" aria-label="Slide navigation">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`dot${i === slide ? ' active' : ''}`}
              onClick={() => setSlide(i)}
              role="tab"
              aria-selected={i === slide}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Animated Canvas Banner ── */}
      <section className="promo-banner" aria-label="Promotional banner">
        <canvas
          id="promo-canvas"
          ref={canvasRef}
          width={1200}
          height={56}
          role="img"
          aria-label="Animated sale promotion"
          data-testid="promo-canvas"
        >
          SALE — Up to 40% OFF!
        </canvas>
      </section>

      {/* ── Category Cards ── */}
      <section className="categories-section" aria-label="Shop by category">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          <div className="categories-grid" role="list">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                to={`/products?category_id=${cat.id}`}
                className="category-card"
                style={{ '--cat-color': cat.color }}
                role="listitem"
                data-testid={`category-card-${cat.id}`}
              >
                <span className="cat-emoji">{cat.emoji}</span>
                <span className="cat-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products Grid ── */}
      <section className="featured-section" aria-label="Featured products">
        <div className="container">
          <h2 className="section-title">⭐ Featured Products</h2>
          {loading ? (
            <div className="skeleton-grid">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)}
            </div>
          ) : (
            <div className="featured-grid" role="list">
              {featured.map((product, idx) => (
                <article
                  key={product.id}
                  className="product-card"
                  role="listitem"
                  style={{ animationDelay: `${idx * 80}ms` }}
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="card-img-wrap">
                    <img
                      src={product.image_url || `https://placehold.co/400x300?text=${encodeURIComponent(product.name)}`}
                      alt={product.name}
                      loading="lazy"
                    />
                    {product.original_price && (
                      <span className="badge-sale">
                        -{Math.round((1 - product.price / product.original_price) * 100)}%
                      </span>
                    )}
                    {product.stock < 10 && product.stock > 0 && (
                      <span className="badge-low">Low Stock</span>
                    )}
                    {product.stock === 0 && (
                      <span className="badge-out">Out of Stock</span>
                    )}
                  </div>
                  <div className="card-body">
                    <p className="card-category">{product.category?.name}</p>
                    <h3>{product.name}</h3>
                    <p className="card-desc">{product.description?.slice(0, 72)}…</p>
                    <div className="price-row">
                      <mark className="price">${product.price?.toFixed(2)}</mark>
                      {product.original_price && (
                        <del className="original-price">${product.original_price?.toFixed(2)}</del>
                      )}
                    </div>
                    <div className="stock-row">
                      <label htmlFor={`stock-${product.id}`} className="label-sm">Stock</label>
                      <meter id={`stock-${product.id}`} value={product.stock} min={0} max={200} low={10} high={80} optimum={150}>
                        {product.stock} units
                      </meter>
                    </div>
                    <progress className="deal-bar" value={Math.min(product.stock, 100)} max={100} title="Deal popularity" />
                    <div className="card-actions">
                      <button
                        className={`btn btn-add${addedId === product.id ? ' added' : ''}`}
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        data-testid={`add-to-cart-btn-${product.id}`}
                        aria-label={`Add ${product.name} to cart`}
                      >
                        {addedId === product.id ? '✓ Added' : 'Add to Cart'}
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => navigate(`/products/${product.id}`)}
                        data-testid={`view-product-btn-${product.id}`}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── All Products Carousel ── */}
      <section className="carousel-section" aria-label="All products carousel">
        <div className="container">
          <div className="carousel-header">
            <h2 className="section-title">🛍️ All Products</h2>
            <div className="carousel-controls">
              <button className="carousel-btn" onClick={prevCarousel} disabled={carouselIndex === 0} aria-label="Previous">‹</button>
              <button className="carousel-btn" onClick={nextCarousel} disabled={carouselIndex >= allProducts.length - cardsPerView} aria-label="Next">›</button>
            </div>
          </div>
          <div className="carousel-track" aria-live="polite">
            {loading
              ? [...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)
              : visibleProducts.map(product => (
                <article key={product.id} className="carousel-card" data-testid={`carousel-card-${product.id}`}>
                  <figure className="carousel-img-wrap">
                    <img
                      src={product.image_url || `https://placehold.co/300x200?text=${encodeURIComponent(product.name)}`}
                      alt={product.name}
                      loading="lazy"
                    />
                    <figcaption className="sr-only">{product.name}</figcaption>
                  </figure>
                  <div className="carousel-body">
                    <h4>{product.name}</h4>
                    <div className="price-row">
                      <mark className="price">${product.price?.toFixed(2)}</mark>
                      {product.original_price && <del className="original-price">${product.original_price?.toFixed(2)}</del>}
                    </div>
                    <button
                      className={`btn btn-sm${addedId === product.id ? ' added' : ''}`}
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      data-testid={`carousel-add-btn-${product.id}`}
                    >
                      {addedId === product.id ? '✓' : '+ Cart'}
                    </button>
                  </div>
                </article>
              ))
            }
          </div>
          <div className="carousel-dots">
            {Array.from({ length: Math.max(1, allProducts.length - cardsPerView + 1) }).map((_, i) => (
              <button key={i} className={`dot${i === carouselIndex ? ' active' : ''}`} onClick={() => setCarouselIndex(i)} aria-label={`Page ${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Sale Info Bar ── */}
      <section className="sale-bar container" aria-label="Sale information">
        <p>
          🕐 Offer ends <time dateTime="2026-12-31T23:59:00">December 31, 2026</time>
          &nbsp;·&nbsp;<abbr title="Value Added Tax">VAT</abbr> included &nbsp;·&nbsp;
          Use code <strong>SAVE20</strong> at checkout
        </p>
      </section>

      {/* ── About (details/summary) ── */}
      <section className="about-section container">
        <details data-testid="about-details">
          <summary>About ShoppingMarket</summary>
          <div className="about-body">
            <p>ShoppingMarket has been serving customers since 2020, stocking 10,000+ products across 5 categories.</p>
            <ul>
              <li>Free shipping on orders over $100</li>
              <li>30-day hassle-free returns</li>
              <li>Secure <abbr title="Secure Sockets Layer">SSL</abbr> encrypted payments</li>
              <li>Customer support 7 days a week</li>
            </ul>
          </div>
        </details>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonials container" aria-label="Customer testimonials">
        <h2 className="section-title">💬 What Customers Say</h2>
        <div className="testimonials-grid">
          {[
            { name: 'Sarah Mitchell', text: 'Quality products and lightning-fast delivery. Will definitely shop again!', rating: 5 },
            { name: 'James Cooper',   text: 'Amazing deals and a huge selection. My go-to store for everything.',   rating: 5 },
            { name: 'Priya Sharma',   text: 'Easy returns, great prices, and the app is super smooth.',             rating: 4 },
          ].map((t, i) => (
            <figure key={i} className="testimonial-card">
              <div className="testimonial-stars" aria-label={`${t.rating} stars`}>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
              <blockquote><p>"{t.text}"</p></blockquote>
              <figcaption><cite>— {t.name}</cite></figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── Why Us ── */}
      <section className="why-us container" aria-label="Why shop with us">
        <h2 className="section-title">Why Shop With Us?</h2>
        <ul className="why-list" role="list">
          {[
            { icon: '🚚', title: 'Fast Shipping',   desc: 'Orders dispatched within 24 hours' },
            { icon: '🔒', title: 'Secure Checkout', desc: 'SSL-encrypted, fraud-protected' },
            { icon: '↩️', title: 'Easy Returns',    desc: '30-day no-questions-asked policy' },
            { icon: '💰', title: 'Price Match',     desc: 'We match any competitor price' },
          ].map((w, i) => (
            <li key={i} role="listitem" className="why-card">
              <span className="why-icon">{w.icon}</span>
              <strong>{w.title}</strong>
              <p>{w.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Media elements (required HTML coverage) ── */}
      <section className="media-section container" aria-label="Media">
        <details>
          <summary>🎬 Promo Video &amp; Audio</summary>
          <div className="media-body">
            <video controls muted loop width="360" aria-label="Store promo" data-testid="hero-video">
              <source src="/media/promo.mp4" type="video/mp4" />
              <track kind="captions" src="/media/promo.vtt" label="English" srcLang="en" default />
              Your browser does not support video.
            </video>
            <audio controls aria-label="Promo jingle" data-testid="hero-audio">
              <source src="/media/jingle.mp3" type="audio/mpeg" />
              Your browser does not support audio.
            </audio>
          </div>
        </details>
      </section>

    </div>
  )
}
