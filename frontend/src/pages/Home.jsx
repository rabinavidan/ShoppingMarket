import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { useCart } from '../context/CartContext'
import './Home.css'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef(null)
  const { addToCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/products/featured')
      .then(data => {
        setFeatured(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    grad.addColorStop(0, '#2563eb')
    grad.addColorStop(1, '#f59e0b')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 28px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 6
    ctx.fillText('🔥 SALE — Up to 40% OFF!', canvas.width / 2, canvas.height / 2)
  }, [])

  function renderStars(rating) {
    if (!rating) return null
    const full = Math.floor(rating)
    const half = rating - full >= 0.5
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0))
  }

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero-section" aria-label="Hero banner">
        <div className="hero-content">
          <h2>Welcome to ShoppingMarket</h2>
          <p>Discover amazing products at unbeatable prices.</p>
          <Link to="/products" className="btn hero-cta" data-testid="hero-shop-now-btn">
            Shop Now
          </Link>
        </div>
        <div className="hero-media">
          <video
            controls
            muted
            loop
            width="400"
            aria-label="Store promo video"
            data-testid="hero-video"
          >
            <source src="/media/promo.mp4" type="video/mp4" />
            <track kind="captions" src="/media/promo.vtt" label="English" srcLang="en" default />
            Your browser does not support the video element.
          </video>
          <audio controls aria-label="Promo audio jingle" data-testid="hero-audio">
            <source src="/media/jingle.mp3" type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </section>

      {/* Promo Canvas */}
      <section className="promo-banner" aria-label="Promotional banner">
        <div className="container">
          <canvas
            id="promo-canvas"
            ref={canvasRef}
            width={700}
            height={80}
            role="img"
            aria-label="Sale promotion graphic"
          >
            SALE - Up to 40% OFF!
          </canvas>
        </div>
      </section>

      {/* Sale countdown */}
      <section className="sale-countdown container">
        <p>
          Limited time offer ends:&nbsp;
          <time dateTime="2026-12-31T23:59:00">December 31, 2026 at midnight</time>
          &nbsp;&mdash;&nbsp;
          <abbr title="Value Added Tax">VAT</abbr> included in all prices.
        </p>
      </section>

      {/* About store details */}
      <section className="about-section container">
        <details>
          <summary>About Our Store</summary>
          <div className="about-body">
            <p>
              ShoppingMarket has been serving customers since 2020. We stock over 10,000 products
              across Electronics, Clothing, Food &amp; Drinks, Books, and Home &amp; Garden.
            </p>
            <ul>
              <li>Free shipping on orders over $100</li>
              <li>30-day hassle-free returns</li>
              <li>Secure payments with 256-bit encryption</li>
              <li>Customer support 7 days a week</li>
            </ul>
          </div>
        </details>
      </section>

      {/* Testimonials */}
      <section className="testimonials container" aria-label="Customer testimonials">
        <h2>What Our Customers Say</h2>
        <div className="testimonials-grid">
          <figure className="testimonial-card card p-2">
            <blockquote cite="https://shoppingmarket.com/reviews/1">
              <p>"The quality of products and speed of delivery exceeded my expectations. Will definitely shop again!"</p>
            </blockquote>
            <figcaption>
              <cite>— Sarah Mitchell, verified buyer</cite>
            </figcaption>
          </figure>
          <figure className="testimonial-card card p-2">
            <blockquote cite="https://shoppingmarket.com/reviews/2">
              <p>"Amazing deals and a huge selection. ShoppingMarket is now my go-to for everything."</p>
            </blockquote>
            <figcaption>
              <cite>— James Cooper, loyal customer</cite>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section container" aria-label="Featured products">
        <h2>Featured Products</h2>
        {loading ? (
          <div className="loading" role="status" aria-live="polite">Loading featured products...</div>
        ) : (
          <div className="featured-grid grid grid-auto" role="list">
            {featured.map(product => (
              <article
                key={product.id}
                className="product-card card"
                role="listitem"
                data-testid={`product-card-${product.id}`}
              >
                <figure>
                  <img
                    src={product.image_url || 'https://placehold.co/400x300?text=Product'}
                    alt={product.name}
                    loading="lazy"
                  />
                  <figcaption className="sr-only">{product.name}</figcaption>
                </figure>
                <div className="card-body">
                  {product.is_featured && (
                    <span className="badge badge-accent">Featured</span>
                  )}
                  <h3>{product.name}</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
                    {product.description?.slice(0, 80)}...
                  </p>
                  <div className="price-row">
                    <mark className="price">${product.price?.toFixed(2)}</mark>
                    {product.original_price && (
                      <del className="original-price">${product.original_price?.toFixed(2)}</del>
                    )}
                  </div>
                  <div className="stock-meter">
                    <label htmlFor={`stock-${product.id}`} className="text-muted" style={{ fontSize: '0.8rem' }}>
                      Stock:
                    </label>
                    <meter
                      id={`stock-${product.id}`}
                      value={product.stock}
                      min={0}
                      max={100}
                      low={10}
                      high={50}
                      optimum={80}
                    >
                      {product.stock} units
                    </meter>
                  </div>
                  <div className="deal-progress">
                    <label htmlFor={`deal-${product.id}`} className="text-muted" style={{ fontSize: '0.8rem' }}>
                      Deal popularity:
                    </label>
                    <progress id={`deal-${product.id}`} value={Math.min(product.stock, 100)} max={100} />
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn"
                      onClick={() => addToCart(product.id, 1)}
                      data-testid="add-to-cart-btn"
                      aria-label={`Add ${product.name} to cart`}
                    >
                      Add to Cart
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
        <div className="text-center mt-3">
          <Link to="/products" className="btn btn-outline" data-testid="view-all-products-btn">
            View All Products
          </Link>
        </div>
      </section>

      {/* Feature bullets */}
      <section className="features-section container" aria-label="Store features">
        <h2>Why Shop With Us?</h2>
        <ul className="features-list" role="list">
          <li role="listitem">
            <strong>Fast Shipping</strong> — orders dispatched within 24 hours
          </li>
          <li role="listitem">
            <strong>Secure Checkout</strong> — <abbr title="Secure Sockets Layer">SSL</abbr> encrypted payments
          </li>
          <li role="listitem">
            <strong>Easy Returns</strong> — 30-day no-questions-asked returns
          </li>
          <li role="listitem">
            <strong>Price Match</strong> — we match competitor prices
          </li>
        </ul>
      </section>
    </div>
  )
}
