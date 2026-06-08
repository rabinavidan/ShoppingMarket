import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import './Profile.css'

export default function Profile() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [orders, setOrders] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [settings, setSettings] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    theme_color: '#2563eb', language: 'en', timezone: 'UTC',
    notifications_freq: 5,
    privacy: 'public',
    bio: '',
  })
  const [settingsSaved, setSettingsSaved] = useState(false)
  const spendingCanvasRef = useRef(null)
  const { addToCart } = useCart()

  useEffect(() => {
    if (!user && !token) {
      navigate('/auth')
    }
  }, [user, token, navigate])

  useEffect(() => {
    if (!user) return
    setSettings(prev => ({
      ...prev,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      bio: user.bio || '',
    }))
    if (activeTab === 'orders') {
      api.get(`/users/${user.id}/orders`)
        .then(d => setOrders(Array.isArray(d) ? d : []))
        .catch(() => {})
    }
    if (activeTab === 'wishlist') {
      api.get(`/users/${user.id}/wishlist`)
        .then(d => setWishlist(Array.isArray(d) ? d : []))
        .catch(() => {})
    }
  }, [user, activeTab])

  useEffect(() => {
    const canvas = spendingCanvasRef.current
    if (!canvas || activeTab !== 'overview') return
    const ctx = canvas.getContext('2d')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const values = [45, 120, 80, 200, 165, 90]
    const maxVal = Math.max(...values)
    const barW = (canvas.width - 60) / months.length - 10
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = '12px system-ui, sans-serif'

    months.forEach((month, i) => {
      const x = 30 + i * (barW + 10)
      const barH = (values[i] / maxVal) * (canvas.height - 50)
      const y = canvas.height - barH - 25

      const grad = ctx.createLinearGradient(0, y, 0, y + barH)
      grad.addColorStop(0, '#2563eb')
      grad.addColorStop(1, '#3b82f6')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(x, y, barW, barH, 4)
      ctx.fill()

      ctx.fillStyle = '#64748b'
      ctx.textAlign = 'center'
      ctx.fillText(month, x + barW / 2, canvas.height - 8)
      ctx.fillStyle = '#1e293b'
      ctx.fillText(`$${values[i]}`, x + barW / 2, y - 5)
    })
  }, [activeTab, orders])

  async function handleSaveSettings(e) {
    e.preventDefault()
    await api.put(`/users/${user.id}`, {
      first_name: settings.first_name,
      last_name: settings.last_name,
      phone: settings.phone,
      bio: settings.bio,
    })
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 3000)
  }

  async function handleRemoveWishlist(productId) {
    await api.delete(`/users/${user.id}/wishlist/${productId}`)
    setWishlist(prev => prev.filter(w => w.product_id !== productId))
  }

  if (!user) return <div className="loading container">Loading profile...</div>

  const loyaltyPoints = 350
  const nextTierPoints = 1000

  return (
    <div className="profile-page">
      <div className="container">
        <h1>My Account</h1>

        <div className="tabs" role="tablist">
          {['overview', 'orders', 'wishlist', 'settings'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`profile-tab-${tab}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content" data-testid="profile-overview">
            <div className="overview-layout">
              <div className="profile-card card p-3">
                <figure className="avatar-figure text-center">
                  <img
                    src={user.avatar_url || `https://placehold.co/100x100?text=${user.username?.[0]?.toUpperCase()}`}
                    alt={`${user.first_name} ${user.last_name}`}
                    width={100}
                    height={100}
                    style={{ borderRadius: '50%', margin: '0 auto 0.75rem' }}
                  />
                  <figcaption>
                    <strong>{user.first_name} {user.last_name}</strong>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>@{user.username}</p>
                    <span className="badge badge-accent">
                      <abbr title="Very Important Person">VIP</abbr> Member
                    </span>
                  </figcaption>
                </figure>

                <dl className="mt-2">
                  <dt>Email</dt><dd>{user.email}</dd>
                  <dt>Phone</dt><dd>{user.phone || 'Not set'}</dd>
                  <dt>Member since</dt><dd>{new Date(user.created_at).toLocaleDateString()}</dd>
                  <dt>Bio</dt><dd>{user.bio || 'No bio set'}</dd>
                </dl>
              </div>

              <div className="loyalty-card card p-3">
                <h3>Loyalty Points</h3>
                <p className="text-muted">Current Points: <strong>{loyaltyPoints}</strong></p>
                <label htmlFor="loyalty-meter">Points balance:</label>
                <meter
                  id="loyalty-meter"
                  value={loyaltyPoints}
                  min={0}
                  max={1000}
                  low={100}
                  high={500}
                  optimum={1000}
                  aria-label={`Loyalty points: ${loyaltyPoints} of 1000`}
                />
                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {nextTierPoints - loyaltyPoints} points to next tier
                </p>
                <label htmlFor="tier-progress">Progress to Gold tier:</label>
                <progress
                  id="tier-progress"
                  value={loyaltyPoints}
                  max={nextTierPoints}
                  aria-label="Progress to next loyalty tier"
                />

                <h4 className="mt-2">Monthly Spending</h4>
                <canvas
                  id="spending-chart"
                  ref={spendingCanvasRef}
                  width={300}
                  height={160}
                  role="img"
                  aria-label="Monthly spending bar chart"
                  style={{ maxWidth: '100%', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="tab-content" data-testid="profile-orders">
            <h2>Order History</h2>
            {orders.length === 0 ? (
              <p className="text-muted">No orders yet.</p>
            ) : (
              <div className="table-wrapper">
                <table id="order-history-table" data-testid="order-history-table">
                  <caption>Order History</caption>
                  <thead>
                    <tr>
                      <th scope="col">Order #</th>
                      <th scope="col">Date</th>
                      <th scope="col">Status</th>
                      <th scope="col">Total</th>
                      <th scope="col">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} data-testid={`order-row-${order.id}`}>
                        <td>#{order.id}</td>
                        <td>
                          <time dateTime={order.created_at}>
                            {new Date(order.created_at).toLocaleDateString()}
                          </time>
                        </td>
                        <td>
                          <span className={`badge badge-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'primary'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>${order.total_amount?.toFixed(2)}</td>
                        <td>
                          <details>
                            <summary>View Items</summary>
                            <dl style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                              {(order.items || []).map(item => (
                                <React.Fragment key={item.id}>
                                  <dt>{item.product?.name || `Product #${item.product_id}`}</dt>
                                  <dd>Qty: {item.quantity} × ${item.unit_price?.toFixed(2)}</dd>
                                </React.Fragment>
                              ))}
                            </dl>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Total Orders</td>
                      <td colSpan={2}>{orders.length}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div className="tab-content" data-testid="profile-wishlist">
            <h2>My Wishlist</h2>
            {wishlist.length === 0 ? (
              <p className="text-muted">Your wishlist is empty.</p>
            ) : (
              <ul id="wishlist-list" className="wishlist-grid" role="list" data-testid="wishlist-list">
                {wishlist.map(item => (
                  <li key={item.id} role="listitem">
                    <article className="card wishlist-card" data-testid={`wishlist-item-${item.id}`}>
                      {item.product && (
                        <>
                          <img
                            src={item.product.image_url || 'https://placehold.co/200x150?text=Prod'}
                            alt={item.product.name}
                            style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                          />
                          <div className="card-body">
                            <h4>{item.product.name}</h4>
                            <p className="price">${item.product.price?.toFixed(2)}</p>
                            <div style={{ marginBottom: '0.5rem' }}>
                              <label htmlFor={`wl-stock-${item.id}`} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stock:</label>
                              <meter
                                id={`wl-stock-${item.id}`}
                                value={item.product.stock}
                                min={0}
                                max={100}
                                low={10}
                                high={50}
                                optimum={80}
                              />
                            </div>
                            <div className="card-actions">
                              <button
                                className="btn"
                                onClick={() => addToCart(item.product_id, 1)}
                                style={{ fontSize: '0.85rem' }}
                                data-testid={`wishlist-add-cart-${item.id}`}
                              >
                                Add to Cart
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleRemoveWishlist(item.product_id)}
                                style={{ fontSize: '0.85rem' }}
                                data-testid={`wishlist-remove-${item.id}`}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="tab-content" data-testid="profile-settings">
            <div className="settings-layout">
              <form
                id="settings-form"
                onSubmit={handleSaveSettings}
                data-testid="settings-form"
              >
                <fieldset>
                  <legend>Personal Information</legend>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="settings-first-name">First Name</label>
                      <input
                        id="settings-first-name"
                        type="text"
                        value={settings.first_name}
                        onChange={e => setSettings(p => ({ ...p, first_name: e.target.value }))}
                        data-testid="settings-first-name-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="settings-last-name">Last Name</label>
                      <input
                        id="settings-last-name"
                        type="text"
                        value={settings.last_name}
                        onChange={e => setSettings(p => ({ ...p, last_name: e.target.value }))}
                        data-testid="settings-last-name-input"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="settings-email">Email</label>
                    <input
                      id="settings-email"
                      type="email"
                      value={settings.email}
                      onChange={e => setSettings(p => ({ ...p, email: e.target.value }))}
                      data-testid="settings-email-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="settings-phone">Phone</label>
                    <input
                      id="settings-phone"
                      type="tel"
                      value={settings.phone}
                      onChange={e => setSettings(p => ({ ...p, phone: e.target.value }))}
                      data-testid="settings-phone-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="settings-birthdate">Date of Birth</label>
                    <input
                      id="settings-birthdate"
                      type="date"
                      data-testid="settings-birthdate-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="settings-bio">Bio</label>
                    <textarea
                      id="settings-bio"
                      rows={3}
                      value={settings.bio}
                      onChange={e => setSettings(p => ({ ...p, bio: e.target.value }))}
                      data-testid="settings-bio-textarea"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="settings-avatar">Update Profile Picture</label>
                    <input
                      id="settings-avatar"
                      type="file"
                      accept="image/*"
                      data-testid="settings-avatar-input"
                    />
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Appearance</legend>
                  <div className="form-group">
                    <label htmlFor="settings-theme">Theme Colour</label>
                    <input
                      id="settings-theme"
                      type="color"
                      value={settings.theme_color}
                      onChange={e => setSettings(p => ({ ...p, theme_color: e.target.value }))}
                      data-testid="settings-theme-color-input"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="settings-language">Language</label>
                      <select
                        id="settings-language"
                        value={settings.language}
                        onChange={e => setSettings(p => ({ ...p, language: e.target.value }))}
                        data-testid="settings-language-select"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="settings-timezone">Timezone</label>
                      <select
                        id="settings-timezone"
                        value={settings.timezone}
                        onChange={e => setSettings(p => ({ ...p, timezone: e.target.value }))}
                        data-testid="settings-timezone-select"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern</option>
                        <option value="America/Los_Angeles">Pacific</option>
                        <option value="Europe/London">London</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Notifications</legend>
                  <div className="form-group">
                    <label htmlFor="notif-freq">
                      Email frequency:{' '}
                      <output htmlFor="notif-freq">
                        {settings.notifications_freq <= 2 ? 'Rarely' : settings.notifications_freq <= 5 ? 'Occasionally' : 'Frequently'}
                      </output>
                    </label>
                    <input
                      id="notif-freq"
                      type="range"
                      min={1}
                      max={10}
                      value={settings.notifications_freq}
                      onChange={e => setSettings(p => ({ ...p, notifications_freq: Number(e.target.value) }))}
                      data-testid="notif-freq-range"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" defaultChecked data-testid="notif-order-checkbox" />
                      {' '}Order status updates
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" data-testid="notif-promo-checkbox" />
                      {' '}Promotional offers
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" defaultChecked data-testid="notif-security-checkbox" />
                      {' '}Security alerts
                    </label>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Privacy</legend>
                  <div className="radio-group">
                    {[
                      { value: 'public', label: 'Public — anyone can see your profile' },
                      { value: 'friends', label: 'Friends only' },
                      { value: 'private', label: 'Private' },
                    ].map(opt => (
                      <label key={opt.value} className="radio-label">
                        <input
                          type="radio"
                          name="privacy"
                          value={opt.value}
                          checked={settings.privacy === opt.value}
                          onChange={() => setSettings(p => ({ ...p, privacy: opt.value }))}
                          data-testid={`privacy-radio-${opt.value}`}
                        />
                        {' '}{opt.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {settingsSaved && (
                  <p className="text-success" role="alert">Settings saved successfully!</p>
                )}

                <button type="submit" className="btn" data-testid="save-settings-btn">
                  Save Changes
                </button>
              </form>

              <aside className="settings-aside">
                <div className="card p-2 mb-2">
                  <h4>
                    <abbr title="Very Important Person">VIP</abbr> Status
                  </h4>
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                    You are a Silver member. Earn {nextTierPoints - loyaltyPoints} more points to reach Gold.
                  </p>
                </div>
                <iframe
                  sandbox="allow-scripts"
                  title="Store Locator"
                  src="about:blank"
                  width="100%"
                  height="180"
                  style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  data-testid="store-locator-iframe"
                />
                <p className="text-muted text-center mt-1" style={{ fontSize: '0.8rem' }}>
                  Store Locator (map placeholder)
                </p>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

