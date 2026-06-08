import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import './Checkout.css'

const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose']

export default function Checkout() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [tipValue, setTipValue] = useState(0)
  const [pwValue, setPwValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', website: '',
    street: '', apartment: '', country: 'US', state: '', zip: '',
    delivery_date: '', delivery_time: '', scheduled_delivery: '', delivery_week: '',
    shipping_method: 'standard',
    card_number: '', card_expiry: '', cvv: '', card_name: '',
    gift_wrap: false, ribbon_color: '#ff0000', gift_message: '', notes: '',
    accept_terms: false, marketing_opt_in: false, create_account: false,
    account_password: '',
  })

  // Pre-fill form with logged-in user data
  useEffect(() => {
    if (!user) return
    setFormData(prev => ({
      ...prev,
      first_name: user.first_name || prev.first_name,
      last_name:  user.last_name  || prev.last_name,
      email:      user.email      || prev.email,
      phone:      user.phone      || prev.phone,
      card_name:  user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : prev.card_name,
    }))
  }, [user])
  const { cart, cartTotal, sessionId } = useCart()
  const navigate = useNavigate()

  function update(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function pwStrength(pw) {
    if (!pw) return 0
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }

  function pwStrengthLabel(score) {
    if (score <= 1) return 'Weak'
    if (score <= 2) return 'Fair'
    if (score <= 3) return 'Good'
    return 'Strong'
  }

  async function handlePlaceOrder(e) {
    e.preventDefault()
    if (!formData.accept_terms) { alert('Please accept terms and conditions.'); return }
    setSubmitting(true)
    const shippingAddress = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      street: formData.street,
      apartment: formData.apartment,
      city: formData.city || '',
      state: formData.state,
      zip: formData.zip,
      country: formData.country,
    }
    const shippingCost = formData.shipping_method === 'overnight' ? 24.99 : formData.shipping_method === 'express' ? 12.99 : 4.99
    try {
      const order = await api.post('/orders', {
        session_id: sessionId,
        shipping_address: shippingAddress,
        payment_method: 'card',
        notes: formData.notes,
      })
      setSubmitting(false)
      if (order && order.id) {
        navigate(`/confirmation/${order.id}`)
      } else {
        alert('Order failed: ' + (order?.detail || 'Unknown error'))
      }
    } catch (err) {
      setSubmitting(false)
      alert('Order failed. Please try again.')
    }
  }

  const pwScore = pwStrength(pwValue)

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>

        <div className="checkout-progress-wrapper">
          <progress
            id="checkout-progress"
            value={step}
            max={3}
            data-testid="checkout-progress"
            aria-label={`Checkout step ${step} of 3`}
          />
          <div className="step-labels">
            <span className={step >= 1 ? 'active' : ''}>1. Shipping</span>
            <span className={step >= 2 ? 'active' : ''}>2. Payment</span>
            <span className={step >= 3 ? 'active' : ''}>3. Review</span>
          </div>
        </div>

        <form
          id="checkout-form"
          onSubmit={handlePlaceOrder}
          data-testid="checkout-form"
        >
          <input type="hidden" name="session_id" value={sessionId} />

          {/* Step 1 */}
          {step === 1 && (
            <div className="checkout-step" data-testid="checkout-step-1">
              <fieldset>
                <legend>Contact Information</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="first-name">First Name</label>
                    <input id="first-name" type="text" required value={formData.first_name} onChange={e => update('first_name', e.target.value)} data-testid="first-name-input" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last-name">Last Name</label>
                    <input id="last-name" type="text" required value={formData.last_name} onChange={e => update('last_name', e.target.value)} data-testid="last-name-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="checkout-email">Email</label>
                  <input id="checkout-email" type="email" required value={formData.email} onChange={e => update('email', e.target.value)} data-testid="checkout-email-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="checkout-phone">Phone</label>
                  <input id="checkout-phone" type="tel" value={formData.phone} onChange={e => update('phone', e.target.value)} data-testid="checkout-phone-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="checkout-website">Company Website (optional)</label>
                  <input id="checkout-website" type="url" placeholder="https://" value={formData.website} onChange={e => update('website', e.target.value)} data-testid="checkout-website-input" />
                </div>
              </fieldset>

              <fieldset>
                <legend>Shipping Address</legend>
                <div className="form-group">
                  <label htmlFor="city-search">City</label>
                  <input
                    id="city-search"
                    type="search"
                    list="city-suggestions"
                    value={formData.city || ''}
                    onChange={e => update('city', e.target.value)}
                    placeholder="Search your city"
                    data-testid="city-input"
                  />
                  <datalist id="city-suggestions">
                    {CITIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label htmlFor="street">Street Address</label>
                  <input id="street" type="text" required value={formData.street} onChange={e => update('street', e.target.value)} data-testid="street-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="apartment">Apartment / Unit Number</label>
                  <input id="apartment" type="number" value={formData.apartment} onChange={e => update('apartment', e.target.value)} data-testid="apartment-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <select id="country" value={formData.country} onChange={e => update('country', e.target.value)} data-testid="country-select">
                    <optgroup label="North America">
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="MX">Mexico</option>
                    </optgroup>
                    <optgroup label="Europe">
                      <option value="GB">United Kingdom</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="IT">Italy</option>
                    </optgroup>
                    <optgroup label="Asia">
                      <option value="JP">Japan</option>
                      <option value="CN">China</option>
                      <option value="IN">India</option>
                    </optgroup>
                    <optgroup label="Oceania">
                      <option value="AU">Australia</option>
                      <option value="NZ">New Zealand</option>
                    </optgroup>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="state">State / Province</label>
                    <select id="state" value={formData.state} onChange={e => update('state', e.target.value)} data-testid="state-select">
                      <option value="">Select...</option>
                      <option value="CA">California</option>
                      <option value="NY">New York</option>
                      <option value="TX">Texas</option>
                      <option value="FL">Florida</option>
                      <option value="WA">Washington</option>
                      <option value="IL">Illinois</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="zip">ZIP Code</label>
                    <input id="zip" type="number" inputMode="numeric" value={formData.zip} onChange={e => update('zip', e.target.value)} data-testid="zip-input" />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Delivery Preferences</legend>
                <div className="form-group">
                  <label htmlFor="delivery-date">Preferred Delivery Date</label>
                  <input id="delivery-date" type="date" value={formData.delivery_date} onChange={e => update('delivery_date', e.target.value)} data-testid="delivery-date-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="delivery-time">Preferred Time Window</label>
                  <input id="delivery-time" type="time" value={formData.delivery_time} onChange={e => update('delivery_time', e.target.value)} data-testid="delivery-time-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="scheduled-delivery">Scheduled Delivery</label>
                  <input id="scheduled-delivery" type="datetime-local" value={formData.scheduled_delivery} onChange={e => update('scheduled_delivery', e.target.value)} data-testid="scheduled-delivery-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="delivery-week">Delivery Week (alternative)</label>
                  <input id="delivery-week" type="week" value={formData.delivery_week} onChange={e => update('delivery_week', e.target.value)} data-testid="delivery-week-input" />
                </div>
                <div className="form-group">
                  <label>Shipping Method</label>
                  <div className="radio-group">
                    {[
                      { value: 'standard', label: 'Standard (3–5 days) — $4.99' },
                      { value: 'express', label: 'Express (1–2 days) — $12.99' },
                      { value: 'overnight', label: 'Overnight — $24.99' },
                    ].map(opt => (
                      <label key={opt.value} className="radio-label">
                        <input
                          type="radio"
                          name="shipping_method"
                          value={opt.value}
                          checked={formData.shipping_method === opt.value}
                          onChange={() => update('shipping_method', opt.value)}
                          data-testid={`shipping-radio-${opt.value}`}
                        />
                        {' '}{opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </fieldset>

              <div className="step-actions">
                <button type="button" className="btn" onClick={() => setStep(2)} data-testid="step1-next-btn">
                  Continue to Payment &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="checkout-step" data-testid="checkout-step-2">
              <fieldset>
                <legend>Payment</legend>
                <div className="form-group">
                  <label htmlFor="card-number">Card Number</label>
                  <input
                    id="card-number"
                    type="tel"
                    pattern="[0-9\s]{13,19}"
                    placeholder="1234 5678 9012 3456"
                    value={formData.card_number}
                    onChange={e => update('card_number', e.target.value)}
                    data-testid="card-number-input"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="card-expiry">Expiry Date</label>
                    <input id="card-expiry" type="month" value={formData.card_expiry} onChange={e => update('card_expiry', e.target.value)} data-testid="card-expiry-input" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="card-cvv">
                      <abbr title="Card Verification Value">CVV</abbr>
                    </label>
                    <input id="card-cvv" type="number" min={100} max={999} placeholder="123" value={formData.cvv} onChange={e => update('cvv', e.target.value)} data-testid="card-cvv-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="card-name">Cardholder Name</label>
                  <input id="card-name" type="text" value={formData.card_name} onChange={e => update('card_name', e.target.value)} data-testid="card-name-input" />
                </div>
                <div className="payment-iframe-wrapper">
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>Secure payment processing:</p>
                  <iframe
                    sandbox="allow-forms"
                    title="Secure Payment Gateway"
                    src="about:blank"
                    width="100%"
                    height="60"
                    style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    data-testid="payment-iframe"
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend>Gift Options</legend>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.gift_wrap}
                      onChange={e => update('gift_wrap', e.target.checked)}
                      data-testid="gift-wrap-checkbox"
                    />
                    {' '}Add gift wrap (+$2.99)
                  </label>
                </div>
                <div className="form-group">
                  <label htmlFor="ribbon-color">Ribbon Color</label>
                  <input
                    id="ribbon-color"
                    type="color"
                    value={formData.ribbon_color}
                    onChange={e => update('ribbon_color', e.target.value)}
                    data-testid="ribbon-color-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gift-image">Gift Message Image (optional)</label>
                  <input
                    id="gift-image"
                    type="file"
                    accept="image/*"
                    data-testid="gift-image-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gift-message">Gift Message</label>
                  <textarea
                    id="gift-message"
                    rows={3}
                    value={formData.gift_message}
                    onChange={e => update('gift_message', e.target.value)}
                    data-testid="gift-message-textarea"
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend>Tip</legend>
                <div className="form-group">
                  <label htmlFor="tip-range">
                    Tip amount: <output htmlFor="tip-range">{tipValue}%</output>
                  </label>
                  <input
                    id="tip-range"
                    type="range"
                    min={0}
                    max={30}
                    step={5}
                    value={tipValue}
                    onChange={e => setTipValue(Number(e.target.value))}
                    data-testid="tip-range-input"
                  />
                  <div className="tip-labels">
                    {[0, 5, 10, 15, 20, 25, 30].map(v => (
                      <span key={v}>{v}%</span>
                    ))}
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Order Notes</legend>
                <div className="form-group">
                  <label htmlFor="delivery-notes">Delivery Instructions</label>
                  <textarea
                    id="delivery-notes"
                    rows={3}
                    value={formData.notes}
                    onChange={e => update('notes', e.target.value)}
                    placeholder="Leave at door, ring bell, etc."
                    data-testid="delivery-notes-textarea"
                  />
                </div>
              </fieldset>

              <div className="step-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} data-testid="step2-back-btn">
                  &larr; Back
                </button>
                <button type="button" className="btn" onClick={() => setStep(3)} data-testid="step2-next-btn">
                  Review Order &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="checkout-step" data-testid="checkout-step-3">
              <h3>Review Your Order</h3>

              <div className="table-wrapper">
                <table data-testid="order-review-table">
                  <caption>Order Items</caption>
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col">Qty</th>
                      <th scope="col">Price</th>
                      <th scope="col">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id}>
                        <td>{item.product?.name}</td>
                        <td>{item.quantity}</td>
                        <td>${item.product?.price?.toFixed(2)}</td>
                        <td>${(item.product?.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Total</td>
                      <td>${cartTotal.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <dl className="review-details mt-2">
                <dt>Shipping to</dt>
                <dd>{formData.first_name} {formData.last_name}, {formData.street}, {formData.city || ''}, {formData.state} {formData.zip}</dd>
                <dt>Email</dt>
                <dd>{formData.email}</dd>
                <dt>Shipping Method</dt>
                <dd>{formData.shipping_method}</dd>
                <dt>Payment</dt>
                <dd>Card ending {formData.card_number?.slice(-4) || '****'}</dd>
              </dl>

              <fieldset className="mt-2">
                <legend>Account & Agreements</legend>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.accept_terms}
                      onChange={e => update('accept_terms', e.target.checked)}
                      required
                      data-testid="accept-terms-checkbox"
                    />
                    {' '}I accept the <a href="/terms">Terms &amp; Conditions</a>
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.marketing_opt_in}
                      onChange={e => update('marketing_opt_in', e.target.checked)}
                      data-testid="marketing-optin-checkbox"
                    />
                    {' '}Receive marketing emails and special offers
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.create_account}
                      onChange={e => update('create_account', e.target.checked)}
                      data-testid="create-account-checkbox"
                    />
                    {' '}Create an account for faster future checkout
                  </label>
                </div>
                {formData.create_account && (
                  <div className="form-group">
                    <label htmlFor="account-password">Choose Password</label>
                    <input
                      id="account-password"
                      type="password"
                      value={pwValue}
                      onChange={e => setPwValue(e.target.value)}
                      data-testid="account-password-input"
                    />
                    <meter
                      id="pw-strength"
                      value={pwScore}
                      min={0}
                      max={4}
                      low={1}
                      high={3}
                      optimum={4}
                      aria-label="Password strength"
                    />
                    <output htmlFor="account-password" style={{ fontSize: '0.85rem', color: ['', 'var(--danger)', 'var(--accent)', 'var(--success)', 'var(--success)'][pwScore] }}>
                      {pwScore > 0 ? pwStrengthLabel(pwScore) : ''}
                    </output>
                  </div>
                )}
              </fieldset>

              <div className="step-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(2)} data-testid="step3-back-btn">
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={submitting}
                  data-testid="place-order-btn"
                >
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </button>
                <button type="reset" className="btn btn-danger" onClick={() => setStep(1)} data-testid="clear-form-btn">
                  Clear Form
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
