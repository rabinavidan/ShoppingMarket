import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { useCart } from '../context/CartContext'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [giftWrap, setGiftWrap] = useState(false)
  const [reviewForm, setReviewForm] = useState({ reviewer_name: '', rating: 5, body: '', email: '' })
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const canvasRef = useRef(null)
  const { addToCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/reviews`),
    ]).then(([prod, revs]) => {
      setProduct(prod)
      setReviews(Array.isArray(revs) ? revs : [])
      setLoading(false)
      if (prod.category_id) {
        api.get(`/products?category_id=${prod.category_id}&per_page=4`)
          .then(d => setRelated((d.data || []).filter(p => p.id !== prod.id).slice(0, 3)))
          .catch(() => {})
      }
    }).catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reviews.length === 0) return
    const ctx = canvas.getContext('2d')
    const counts = [0, 0, 0, 0, 0]
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++
    })
    const maxCount = Math.max(...counts, 1)
    const barHeight = 20
    const gap = 8
    const labelWidth = 40
    const chartWidth = canvas.width - labelWidth - 20
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = '13px system-ui, sans-serif'
    for (let i = 4; i >= 0; i--) {
      const y = (4 - i) * (barHeight + gap) + 10
      ctx.fillStyle = '#64748b'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${i + 1}★`, labelWidth - 5, y + barHeight / 2)
      const barW = (counts[i] / maxCount) * chartWidth
      const grad = ctx.createLinearGradient(labelWidth, 0, labelWidth + barW, 0)
      grad.addColorStop(0, '#f59e0b')
      grad.addColorStop(1, '#2563eb')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(labelWidth, y, Math.max(barW, 4), barHeight, 4)
      ctx.fill()
      ctx.fillStyle = '#1e293b'
      ctx.textAlign = 'left'
      ctx.fillText(`(${counts[i]})`, labelWidth + barW + 6, y + barHeight / 2)
    }
  }, [reviews])

  async function handleAddToCart(e) {
    e.preventDefault()
    await addToCart(product.id, quantity)
    navigate('/cart')
  }

  async function handleReviewSubmit(e) {
    e.preventDefault()
    await api.post(`/products/${id}/reviews`, {
      reviewer_name: reviewForm.reviewer_name,
      rating: reviewForm.rating,
      body: reviewForm.body,
    })
    const revs = await api.get(`/products/${id}/reviews`)
    setReviews(Array.isArray(revs) ? revs : [])
    setReviewSuccess(true)
    setReviewForm({ reviewer_name: '', rating: 5, body: '', email: '' })
  }

  function avgRating() {
    if (reviews.length === 0) return 0
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  }

  if (loading) return <div className="loading container">Loading product...</div>
  if (!product || product.detail) return <div className="container" style={{ padding: '2rem' }}>Product not found.</div>

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb" role="list">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            {product.category && <li><Link to={`/products?category_id=${product.category_id}`}>{product.category.name}</Link></li>}
            <li aria-current="page">{product.name}</li>
          </ol>
        </nav>

        <div className="product-detail-layout">
          {/* Main Product Info */}
          <div className="product-main">
            <figure className="product-figure">
              <img
                src={product.image_url || 'https://placehold.co/600x450?text=Product'}
                alt={product.name}
                data-testid="product-image"
              />
              <figcaption>{product.name}</figcaption>
            </figure>

            <div className="product-info">
              <h1 data-testid="product-name">{product.name}</h1>
              {product.category && (
                <p className="category-badge">
                  <Link to={`/products?category_id=${product.category_id}`} className="badge badge-secondary">
                    {product.category.name}
                  </Link>
                </p>
              )}

              <div className="price-block">
                <ins className="price" style={{ textDecoration: 'none' }} data-testid="product-price">
                  ${product.price?.toFixed(2)}
                </ins>
                {product.original_price && (
                  <del className="original-price" data-testid="product-original-price">
                    ${product.original_price?.toFixed(2)}
                  </del>
                )}
                {product.original_price && (
                  <span className="badge badge-danger">
                    {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                  </span>
                )}
              </div>

              <div className="rating-block">
                <meter
                  value={avgRating()}
                  min={0}
                  max={5}
                  low={2}
                  high={4}
                  optimum={5}
                  aria-label={`Average rating: ${avgRating().toFixed(1)} out of 5`}
                />
                <span className="stars">{avgRating().toFixed(1)} ★ ({reviews.length} reviews)</span>
              </div>

              <p className="product-description">{product.description}</p>

              <dl className="product-specs">
                <dt><abbr title="Stock Keeping Unit">SKU</abbr></dt>
                <dd data-testid="product-sku">{product.sku}</dd>
                <dt>Stock</dt>
                <dd>{product.stock} units available</dd>
                <dt>Category</dt>
                <dd>{product.category?.name || 'N/A'}</dd>
                <dt>Weight</dt>
                <dd>0.5 kg</dd>
                <dt>Dimensions</dt>
                <dd>20 × 15 × 5 cm</dd>
                <dt><abbr title="Universal Product Code">UPC</abbr></dt>
                <dd>012345678901</dd>
              </dl>

              {/* Add to cart form */}
              <form
                id="add-to-cart-form"
                onSubmit={handleAddToCart}
                data-testid="add-to-cart-form"
              >
                <fieldset>
                  <legend>Add to Cart</legend>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="product-variant">Variant</label>
                      <select id="product-variant" name="variant" data-testid="product-variant-select">
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="gift">Gift Edition</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="quantity">Quantity</label>
                      <input
                        id="quantity"
                        type="number"
                        name="quantity"
                        min={1}
                        max={product.stock}
                        value={quantity}
                        onChange={e => setQuantity(Number(e.target.value))}
                        data-testid="quantity-input"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="gift_wrap"
                        checked={giftWrap}
                        onChange={e => setGiftWrap(e.target.checked)}
                        data-testid="gift-wrap-checkbox"
                      />
                      {' '}Gift wrap (+$2.99)
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="btn"
                    disabled={product.stock === 0}
                    data-testid="add-to-cart-btn"
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </fieldset>
              </form>

              {/* Accordions */}
              <details>
                <summary>Shipping Information</summary>
                <div>
                  <p>Standard shipping (3–5 business days): <strong>$4.99</strong></p>
                  <p>Express shipping (1–2 business days): <strong>$12.99</strong></p>
                  <p>Free shipping on orders over $100.</p>
                </div>
              </details>
              <details>
                <summary>Return Policy</summary>
                <div>
                  <p>We offer a 30-day hassle-free return policy. Items must be in original condition.</p>
                  <p>To initiate a return, contact support@shoppingmarket.com.</p>
                </div>
              </details>
              <details>
                <summary>Specifications</summary>
                <div>
                  <dl>
                    <dt>Material</dt><dd>High-quality composite</dd>
                    <dt>Warranty</dt><dd>1 year manufacturer warranty</dd>
                    <dt>Country of Origin</dt><dd>USA</dd>
                    <dt>Certifications</dt><dd>CE, FCC</dd>
                  </dl>
                </div>
              </details>
            </div>
          </div>

          {/* Reviews */}
          <section className="reviews-section" aria-label="Customer reviews">
            <h2>Customer Reviews</h2>
            <div className="rating-chart-wrapper">
              <canvas
                id="rating-chart"
                ref={canvasRef}
                width={350}
                height={170}
                role="img"
                aria-label="Rating distribution bar chart"
              />
            </div>

            {reviews.length === 0 ? (
              <p className="text-muted">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="reviews-list" role="list">
                {reviews.map(review => (
                  <article key={review.id} className="review-card card p-2" role="listitem" data-testid={`review-${review.id}`}>
                    <blockquote>
                      <p>{review.body}</p>
                    </blockquote>
                    <footer>
                      <span className="stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      <strong>{review.reviewer_name}</strong>
                      <time dateTime={review.created_at} className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {' '}— {new Date(review.created_at).toLocaleDateString()}
                      </time>
                    </footer>
                  </article>
                ))}
              </div>
            )}

            {/* Review form */}
            <form
              id="review-form"
              onSubmit={handleReviewSubmit}
              data-testid="review-form"
              className="review-form card p-2 mt-2"
            >
              <fieldset>
                <legend>Write a Review</legend>
                {reviewSuccess && <p className="text-success">Review submitted successfully!</p>}
                <div className="form-group">
                  <label htmlFor="reviewer-name">Your Name</label>
                  <input
                    id="reviewer-name"
                    type="text"
                    required
                    value={reviewForm.reviewer_name}
                    onChange={e => setReviewForm(p => ({ ...p, reviewer_name: e.target.value }))}
                    data-testid="reviewer-name-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reviewer-email">Email (optional)</label>
                  <input
                    id="reviewer-email"
                    type="email"
                    value={reviewForm.email}
                    onChange={e => setReviewForm(p => ({ ...p, email: e.target.value }))}
                    data-testid="reviewer-email-input"
                  />
                </div>
                <div className="form-group">
                  <label>Rating</label>
                  <div className="star-radio-group">
                    {[5, 4, 3, 2, 1].map(star => (
                      <label key={star} className="star-radio-label">
                        <input
                          type="radio"
                          name="rating"
                          value={star}
                          checked={reviewForm.rating === star}
                          onChange={() => setReviewForm(p => ({ ...p, rating: star }))}
                          data-testid={`rating-radio-${star}`}
                        />
                        {' '}{'★'.repeat(star)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="review-body">Your Review</label>
                  <textarea
                    id="review-body"
                    rows={4}
                    value={reviewForm.body}
                    onChange={e => setReviewForm(p => ({ ...p, body: e.target.value }))}
                    data-testid="review-body-textarea"
                  />
                </div>
                <button type="submit" className="btn" data-testid="submit-review-btn">
                  Submit Review
                </button>
              </fieldset>
            </form>
          </section>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <aside className="related-products" aria-label="Related products">
            <h2>Related Products</h2>
            <div className="grid grid-auto">
              {related.map(p => (
                <article key={p.id} className="product-card card" data-testid={`related-product-${p.id}`}>
                  <img
                    src={p.image_url || 'https://placehold.co/400x300?text=Product'}
                    alt={p.name}
                    style={{ height: '160px', objectFit: 'cover', width: '100%' }}
                  />
                  <div className="card-body">
                    <h4>{p.name}</h4>
                    <p className="price">${p.price?.toFixed(2)}</p>
                    <Link to={`/products/${p.id}`} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                      View
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
