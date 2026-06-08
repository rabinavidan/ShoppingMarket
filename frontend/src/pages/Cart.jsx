import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { useCart } from '../context/CartContext'
import ConfirmDialog from '../components/dialogs/ConfirmDialog'
import './Cart.css'

const FREE_SHIPPING_THRESHOLD = 100

export default function Cart() {
  const { cart, cartTotal, itemCount, updateQuantity, removeFromCart, clearCart, sessionId } = useCart()
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [removingItemId, setRemovingItemId] = useState(null)
  const [randomProducts, setRandomProducts] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/products?per_page=3&sort=newest')
      .then(d => setRandomProducts(d.data || []))
      .catch(() => {})
  }, [])

  async function handleCouponSubmit(e) {
    e.preventDefault()
    if (!couponCode.trim()) return
    setCouponLoading(true)
    const result = await api.post('/coupons/validate', { code: couponCode.trim() })
    setCouponResult(result)
    setCouponLoading(false)
  }

  function computeDiscount() {
    if (!couponResult?.valid) return 0
    if (couponResult.discount_type === 'percent') {
      return cartTotal * couponResult.discount_value / 100
    }
    if (couponResult.discount_type === 'fixed') {
      return couponResult.discount_value
    }
    return 0
  }

  const discount = computeDiscount()
  const shipping = cartTotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : 4.99
  const tax = (cartTotal - discount) * 0.08
  const total = Math.max(cartTotal - discount + tax + shipping, 0)

  function askRemoveItem(itemId) {
    setRemovingItemId(itemId)
    setConfirmOpen(true)
  }

  async function confirmRemove() {
    if (removingItemId !== null) {
      await removeFromCart(removingItemId)
      setRemovingItemId(null)
    }
    setConfirmOpen(false)
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="empty-cart text-center">
            <p>Your cart is empty.</p>
            <Link to="/products" className="btn mt-2" data-testid="continue-shopping-btn">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-main">
              {/* Cart Table */}
              <div className="table-wrapper">
                <table id="cart-table" data-testid="cart-table">
                  <caption>Your Shopping Cart ({itemCount} item{itemCount !== 1 ? 's' : ''})</caption>
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col">Price</th>
                      <th scope="col">Quantity</th>
                      <th scope="col">Subtotal</th>
                      <th scope="col">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id} data-testid={`cart-row-${item.id}`}>
                        <td>
                          <div className="cart-product-cell">
                            <img
                              src={item.product?.image_url || 'https://placehold.co/80x80?text=Prod'}
                              alt={item.product?.name}
                              width={60}
                              height={60}
                              style={{ objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <span>{item.product?.name}</span>
                          </div>
                        </td>
                        <td>${item.product?.price?.toFixed(2)}</td>
                        <td>
                          <input
                            type="number"
                            min={1}
                            max={item.product?.stock || 99}
                            value={item.quantity}
                            onChange={e => updateQuantity(item.id, Number(e.target.value))}
                            style={{ width: '70px' }}
                            data-testid={`qty-input-${item.id}`}
                            aria-label={`Quantity for ${item.product?.name}`}
                          />
                        </td>
                        <td>${(item.product?.price * item.quantity).toFixed(2)}</td>
                        <td>
                          <button
                            className="btn btn-danger"
                            onClick={() => askRemoveItem(item.id)}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                            data-testid={`remove-item-btn-${item.id}`}
                            aria-label={`Remove ${item.product?.name} from cart`}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Total</td>
                      <td colSpan={2}>
                        <output id="cart-total" htmlFor="cart-table" data-testid="cart-total">
                          ${cartTotal.toFixed(2)}
                        </output>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Free Shipping Progress */}
              <div className="free-shipping-bar">
                {cartTotal >= FREE_SHIPPING_THRESHOLD ? (
                  <p className="text-success">You qualify for free shipping!</p>
                ) : (
                  <p>
                    Add ${(FREE_SHIPPING_THRESHOLD - cartTotal).toFixed(2)} more for free shipping
                  </p>
                )}
                <progress
                  id="free-shipping-bar"
                  value={Math.min(cartTotal, FREE_SHIPPING_THRESHOLD)}
                  max={FREE_SHIPPING_THRESHOLD}
                  data-testid="free-shipping-progress"
                  aria-label="Free shipping progress"
                />
              </div>

              {/* Coupon */}
              <form
                id="coupon-form"
                onSubmit={handleCouponSubmit}
                className="coupon-form"
                data-testid="coupon-form"
              >
                <label htmlFor="coupon-input">Coupon Code</label>
                <div className="coupon-row">
                  <input
                    id="coupon-input"
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    placeholder="e.g. SAVE10"
                    data-testid="coupon-input"
                  />
                  <button type="submit" disabled={couponLoading} data-testid="apply-coupon-btn">
                    {couponLoading ? 'Checking...' : 'Apply'}
                  </button>
                </div>
                {couponResult && (
                  <p className={couponResult.valid ? 'text-success' : 'text-danger'} role="alert">
                    {couponResult.valid ? `${couponResult.message} (${couponResult.discount_type === 'percent' ? couponResult.discount_value + '%' : '$' + couponResult.discount_value} off)` : couponResult.message}
                  </p>
                )}
              </form>

              {/* Order Summary details */}
              <details className="order-summary-details">
                <summary>Order Summary</summary>
                <dl>
                  <dt>Subtotal</dt>
                  <dd>${cartTotal.toFixed(2)}</dd>
                  {discount > 0 && (
                    <>
                      <dt>Coupon Discount</dt>
                      <dd className="text-success">-${discount.toFixed(2)}</dd>
                    </>
                  )}
                  <dt>Tax (8%)</dt>
                  <dd>${tax.toFixed(2)}</dd>
                  <dt>Shipping</dt>
                  <dd>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</dd>
                </dl>
              </details>
            </div>

            {/* Cart Sidebar */}
            <aside className="cart-sidebar">
              {/* Cost Breakdown */}
              <div className="cost-breakdown card p-2" data-testid="cost-breakdown">
                <h3>Order Total</h3>
                <dl>
                  <dt>Subtotal</dt>
                  <dd>${cartTotal.toFixed(2)}</dd>
                  {discount > 0 && (
                    <>
                      <dt>Discount</dt>
                      <dd className="text-success">-${discount.toFixed(2)}</dd>
                    </>
                  )}
                  <dt>Tax (8%)</dt>
                  <dd>${tax.toFixed(2)}</dd>
                  <dt>Shipping</dt>
                  <dd>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</dd>
                  <dt><strong>Total</strong></dt>
                  <dd><strong>${total.toFixed(2)}</strong></dd>
                </dl>
                <div className="cart-ctas">
                  <button
                    className="btn"
                    onClick={() => navigate('/checkout')}
                    data-testid="checkout-btn"
                    style={{ width: '100%' }}
                  >
                    Proceed to Checkout
                  </button>
                  <Link
                    to="/products"
                    className="btn btn-ghost"
                    style={{ width: '100%', textAlign: 'center', marginTop: '0.5rem' }}
                    data-testid="continue-shopping-link"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>

              {/* You Might Also Like */}
              {randomProducts.length > 0 && (
                <aside className="might-like card p-2 mt-2" aria-label="You might also like">
                  <h4>You Might Also Like</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                    {randomProducts.map(p => (
                      <div key={p.id} className="mini-product">
                        <img
                          src={p.image_url || 'https://placehold.co/60x60?text=P'}
                          alt={p.name}
                          width={50}
                          height={50}
                          style={{ objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <div>
                          <Link to={`/products/${p.id}`} style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            {p.name}
                          </Link>
                          <p style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>${p.price?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </aside>
              )}
            </aside>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Remove Item"
        message="Are you sure you want to remove this item from your cart?"
        onConfirm={confirmRemove}
        onCancel={() => { setConfirmOpen(false); setRemovingItemId(null) }}
      />
    </div>
  )
}
