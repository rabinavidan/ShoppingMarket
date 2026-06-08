import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import './Confirmation.css'

export default function Confirmation() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef(null)

  useEffect(() => {
    api.get(`/orders/${orderId}`)
      .then(data => { setOrder(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [orderId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      vy: 2 + Math.random() * 3,
      vx: (Math.random() - 0.5) * 2,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
      size: 5 + Math.random() * 8,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }))

    let startTime = null
    const duration = 3500

    function draw(timestamp) {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        p.y += p.vy
        p.x += p.vx
        if (p.y > canvas.height) {
          p.y = -10
          p.x = Math.random() * canvas.width
        }
        ctx.fillStyle = p.color
        ctx.beginPath()
        if (p.shape === 'circle') {
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(p.x, p.y, p.size, p.size)
        }
      })

      if (elapsed < duration) {
        requestAnimationFrame(draw)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    requestAnimationFrame(draw)
  }, [order])

  if (loading) return <div className="loading container">Loading order...</div>
  if (!order || order.detail) return (
    <div className="container" style={{ padding: '2rem' }}>
      Order not found. <Link to="/">Return Home</Link>
    </div>
  )

  const deliveryDays = order.shipping_address?.shipping_method === 'overnight' ? 1 : order.shipping_address?.shipping_method === 'express' ? 2 : 5
  const deliveryDate = new Date(Date.now() + deliveryDays * 86400000)

  return (
    <div className="confirmation-page">
      <div className="container">
        <canvas
          id="confetti-canvas"
          ref={canvasRef}
          width={800}
          height={200}
          role="img"
          aria-label="Confetti celebration animation"
          className="confetti-canvas"
        />

        <figure className="success-figure text-center">
          <div className="success-icon" role="img" aria-label="Success checkmark">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="38" fill="#22c55e" stroke="#16a34a" strokeWidth="2" />
              <path d="M22 40L34 52L58 28" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <figcaption>
            <h1>Order Confirmed!</h1>
            <p className="text-muted">Thank you for your purchase.</p>
          </figcaption>
        </figure>

        <div className="confirmation-card card p-3">
          <p>
            Order number: <strong data-testid="order-number">#{order.id}</strong>
          </p>
          <p>
            Placed on:{' '}
            <time dateTime={order.created_at} data-testid="order-date">
              {new Date(order.created_at).toLocaleString()}
            </time>
          </p>
          <p>
            Estimated delivery by:{' '}
            <time dateTime={deliveryDate.toISOString()}>
              {deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </time>
          </p>
        </div>

        {/* Ordered Items */}
        <section className="order-items-section mt-3" aria-label="Order items">
          <h2>Your Items</h2>
          <div className="table-wrapper">
            <table data-testid="confirmation-table">
              <caption>Ordered Items</caption>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Unit Price</th>
                  <th scope="col">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map(item => (
                  <tr key={item.id} data-testid={`order-item-${item.id}`}>
                    <td>{item.product?.name || `Product #${item.product_id}`}</td>
                    <td>{item.quantity}</td>
                    <td>${item.unit_price?.toFixed(2)}</td>
                    <td>${(item.unit_price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}><strong>Order Total</strong></td>
                  <td><strong>${order.total_amount?.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Delivery details */}
        <section className="delivery-details mt-3" aria-label="Delivery details">
          <dl>
            <dt>Shipping Address</dt>
            <dd>
              {order.shipping_address?.first_name} {order.shipping_address?.last_name}<br />
              {order.shipping_address?.street}<br />
              {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zip}<br />
              {order.shipping_address?.country}
            </dd>
            <dt>Payment Method</dt>
            <dd>{order.payment_method}</dd>
            <dt>Estimated Delivery</dt>
            <dd>
              <time dateTime={deliveryDate.toISOString()}>
                {deliveryDate.toLocaleDateString()}
              </time>
            </dd>
          </dl>
        </section>

        {/* Delivery progress */}
        <section className="order-progress mt-3" aria-label="Order status">
          <h3>Order Progress</h3>
          <div className="progress-steps">
            <meter
              value={1}
              min={0}
              max={4}
              low={1}
              high={3}
              optimum={4}
              aria-label="Delivery estimate"
            />
            <progress value={1} max={4} aria-label="Order processing status" data-testid="order-progress" />
          </div>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Order received — processing started</p>
        </section>

        {/* What happens next */}
        <section className="next-steps mt-3" aria-label="Next steps">
          <h3>What Happens Next?</h3>
          <ul className="next-steps-list" role="list">
            <li role="listitem">We'll send a confirmation email to <strong>{order.shipping_address?.email || 'your email'}</strong></li>
            <li role="listitem">Your order will be packed and dispatched within 24 hours</li>
            <li role="listitem">You'll receive a tracking number once shipped</li>
            <li role="listitem">Estimated delivery in {deliveryDays} business day{deliveryDays !== 1 ? 's' : ''}</li>
          </ul>
        </section>

        {/* Full breakdown */}
        <details className="mt-3">
          <summary>Full Order Breakdown</summary>
          <div>
            <dl>
              <dt>Order ID</dt><dd>#{order.id}</dd>
              <dt>Status</dt><dd><span className="badge badge-success">{order.status}</span></dd>
              <dt>Notes</dt><dd>{order.notes || 'None'}</dd>
              <dt>Subtotal</dt><dd>${order.total_amount?.toFixed(2)}</dd>
            </dl>
          </div>
        </details>

        <div className="confirmation-actions mt-3">
          <button
            className="btn btn-ghost"
            onClick={() => window.print()}
            data-testid="print-receipt-btn"
          >
            Print Receipt
          </button>
          <Link to="/products" className="btn" data-testid="continue-shopping-btn">
            Continue Shopping
          </Link>
          <Link to="/profile" className="btn btn-outline" data-testid="view-orders-btn">
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  )
}
