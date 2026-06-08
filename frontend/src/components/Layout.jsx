import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

export default function Layout({ children }) {
  const { itemCount } = useCart()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="layout">
      <header className="site-header" role="banner">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="ShoppingMarket Home">
            <h1>ShoppingMarket</h1>
          </Link>

          <nav role="navigation" aria-label="Main navigation">
            <ul className="nav-list" role="list">
              <li role="listitem">
                <Link to="/" data-testid="nav-home-link">Home</Link>
              </li>
              <li role="listitem">
                <Link to="/products" data-testid="nav-products-link">Products</Link>
              </li>
              <li role="listitem">
                <Link to="/profile" data-testid="nav-profile-link">Profile</Link>
              </li>
            </ul>
          </nav>

          <form
            className="search-form"
            onSubmit={handleSearch}
            role="search"
            aria-label="Site search"
          >
            <input
              id="site-search"
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              list="search-suggestions"
              autoComplete="off"
              data-testid="search-input"
              aria-label="Search products"
            />
            <datalist id="search-suggestions">
              <option value="headphones" />
              <option value="laptop" />
              <option value="shoes" />
              <option value="coffee" />
              <option value="books" />
              <option value="garden tools" />
            </datalist>
            <button type="submit" aria-label="Submit search" data-testid="search-submit-btn">
              Search
            </button>
          </form>

          <div className="header-actions">
            <Link
              to="/cart"
              className="cart-btn"
              aria-label={`Shopping cart, ${itemCount} items`}
              data-testid="cart-btn"
            >
              <span role="img" aria-label="Cart">🛒</span>
              {itemCount > 0 && (
                <span className="cart-badge badge badge-primary" data-testid="cart-badge">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="user-menu">
                <span className="user-name" data-testid="user-name">{user.first_name || user.username}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleLogout}
                  data-testid="logout-btn"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/auth" className="btn btn-outline btn-sm" data-testid="login-btn">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" role="main" className="main-content">
        {children}
      </main>

      <footer className="site-footer" role="contentinfo">
        <div className="container footer-inner">
          <div className="footer-section">
            <h3>ShoppingMarket</h3>
            <address>
              <p>123 Commerce Street</p>
              <p>San Francisco, CA 94102</p>
              <p><a href="mailto:support@shoppingmarket.com">support@shoppingmarket.com</a></p>
              <p><a href="tel:+15550100">+1 (555) 010-0000</a></p>
            </address>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <nav aria-label="Footer navigation">
              <ul role="list">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/products">Products</Link></li>
                <li><Link to="/cart">Cart</Link></li>
                <li><Link to="/auth">Sign In</Link></li>
              </ul>
            </nav>
          </div>
          <div className="footer-section">
            <h4>Information</h4>
            <ul role="list">
              <li><abbr title="Value Added Tax">VAT</abbr> included where applicable</li>
              <li>Free shipping on orders over $100</li>
              <li>30-day return policy</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <small>&copy; 2026 ShoppingMarket. All rights reserved.</small>
        </div>
      </footer>
    </div>
  )
}
