import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Auth() {
  const [activeTab, setActiveTab] = useState('login')
  const [loginData, setLoginData] = useState({ email: '', password: '', remember: false })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [regData, setRegData] = useState({
    username: '', email: '', phone: '', first_name: '', last_name: '',
    birthdate: '', website: '', bio: '', gender: '', language: 'en', country: '',
    password: '', confirm_password: '', newsletter: false, accept_terms: false,
  })
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regStep, setRegStep] = useState(1)

  const { login, register } = useAuth()
  const navigate = useNavigate()

  function updateReg(field, value) {
    setRegData(prev => ({ ...prev, [field]: value }))
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
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][score] || ''
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    const result = await login(loginData.email, loginData.password)
    setLoginLoading(false)
    if (result.success) {
      navigate('/')
    } else {
      setLoginError(result.error || 'Login failed')
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (regData.password !== regData.confirm_password) {
      setRegError('Passwords do not match')
      return
    }
    if (!regData.accept_terms) {
      setRegError('Please accept the terms and conditions')
      return
    }
    setRegLoading(true)
    setRegError('')
    const result = await register({
      username: regData.username,
      email: regData.email,
      password: regData.password,
      first_name: regData.first_name,
      last_name: regData.last_name,
      phone: regData.phone,
      bio: regData.bio,
    })
    setRegLoading(false)
    if (result.success) {
      navigate('/')
    } else {
      setRegError(result.error || 'Registration failed')
    }
  }

  const pwScore = pwStrength(regData.password)
  const pwReqs = [
    { met: regData.password.length >= 8, label: 'At least 8 characters' },
    { met: /[A-Z]/.test(regData.password), label: 'One uppercase letter' },
    { met: /[0-9]/.test(regData.password), label: 'One number' },
    { met: /[^A-Za-z0-9]/.test(regData.password), label: 'One special character' },
  ]

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card card p-3">
          <div className="tabs" role="tablist">
            <button
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'login'}
              onClick={() => setActiveTab('login')}
              data-testid="login-tab-btn"
            >
              Sign In
            </button>
            <button
              className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'register'}
              onClick={() => setActiveTab('register')}
              data-testid="register-tab-btn"
            >
              Create Account
            </button>
          </div>

          {/* Login Panel */}
          {activeTab === 'login' && (
            <form
              id="login-form"
              onSubmit={handleLogin}
              data-testid="login-form"
              aria-label="Sign in form"
            >
              <fieldset>
                <legend>Sign In</legend>
                {loginError && <p className="text-danger" role="alert">{loginError}</p>}
                <div className="form-group">
                  <label htmlFor="login-email">Email Address</label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={loginData.email}
                    onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))}
                    data-testid="login-email-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginData.password}
                    onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                    data-testid="login-password-input"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={loginData.remember}
                      onChange={e => setLoginData(p => ({ ...p, remember: e.target.checked }))}
                      data-testid="remember-me-checkbox"
                    />
                    {' '}Remember me
                  </label>
                </div>
                <button type="submit" className="btn" disabled={loginLoading} data-testid="login-submit-btn">
                  {loginLoading ? 'Signing in...' : 'Sign In'}
                </button>
                <p className="mt-1">
                  <a href="/forgot-password">Forgot password?</a>
                </p>
              </fieldset>
            </form>
          )}

          {/* Register Panel */}
          {activeTab === 'register' && (
            <form
              id="register-form"
              onSubmit={handleRegister}
              data-testid="register-form"
              aria-label="Create account form"
            >
              <div className="reg-progress-wrapper">
                <progress
                  id="register-progress"
                  value={regStep}
                  max={3}
                  data-testid="register-progress"
                  aria-label={`Registration step ${regStep} of 3`}
                />
                <div className="step-labels">
                  <span className={regStep >= 1 ? 'active' : ''}>1. Info</span>
                  <span className={regStep >= 2 ? 'active' : ''}>2. Security</span>
                  <span className={regStep >= 3 ? 'active' : ''}>3. Preferences</span>
                </div>
              </div>

              {regError && <p className="text-danger" role="alert">{regError}</p>}

              {regStep === 1 && (
                <fieldset>
                  <legend>Personal Information</legend>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="reg-first-name">First Name</label>
                      <input id="reg-first-name" type="text" required value={regData.first_name} onChange={e => updateReg('first_name', e.target.value)} data-testid="reg-first-name-input" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="reg-last-name">Last Name</label>
                      <input id="reg-last-name" type="text" required value={regData.last_name} onChange={e => updateReg('last_name', e.target.value)} data-testid="reg-last-name-input" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-username">Username</label>
                    <input id="reg-username" type="text" required list="username-suggestions" value={regData.username} onChange={e => updateReg('username', e.target.value)} data-testid="reg-username-input" />
                    <datalist id="username-suggestions">
                      <option value="shopper123" />
                      <option value="buyer_pro" />
                      <option value="market_user" />
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-email">Email</label>
                    <input id="reg-email" type="email" required value={regData.email} onChange={e => updateReg('email', e.target.value)} data-testid="reg-email-input" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-phone">Phone</label>
                    <input id="reg-phone" type="tel" value={regData.phone} onChange={e => updateReg('phone', e.target.value)} data-testid="reg-phone-input" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-birthdate">Date of Birth</label>
                    <input id="reg-birthdate" type="date" value={regData.birthdate} onChange={e => updateReg('birthdate', e.target.value)} data-testid="reg-birthdate-input" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-website">Personal Website (optional)</label>
                    <input id="reg-website" type="url" placeholder="https://" value={regData.website} onChange={e => updateReg('website', e.target.value)} data-testid="reg-website-input" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-avatar">Profile Picture (optional)</label>
                    <input id="reg-avatar" type="file" accept="image/*" data-testid="reg-avatar-input" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="reg-country">Country</label>
                      <select id="reg-country" value={regData.country} onChange={e => updateReg('country', e.target.value)} data-testid="reg-country-select">
                        <option value="">Select country</option>
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="reg-language">Language</label>
                      <select id="reg-language" value={regData.language} onChange={e => updateReg('language', e.target.value)} data-testid="reg-language-select">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-bio">Bio (optional)</label>
                    <textarea id="reg-bio" rows={3} value={regData.bio} onChange={e => updateReg('bio', e.target.value)} data-testid="reg-bio-textarea" />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <div className="radio-group">
                      {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => (
                        <label key={g} className="radio-label">
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={regData.gender === g}
                            onChange={() => updateReg('gender', g)}
                            data-testid={`gender-radio-${g.toLowerCase().replace(/ /g, '-')}`}
                          />
                          {' '}{g}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="step-actions">
                    <button type="button" className="btn" onClick={() => setRegStep(2)} data-testid="reg-step1-next-btn">
                      Continue &rarr;
                    </button>
                  </div>
                </fieldset>
              )}

              {regStep === 2 && (
                <fieldset>
                  <legend>Security</legend>
                  <div className="form-group">
                    <label htmlFor="reg-password">Password</label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      value={regData.password}
                      onChange={e => updateReg('password', e.target.value)}
                      data-testid="reg-password-input"
                    />
                    <meter
                      id="reg-pw-strength"
                      value={pwScore}
                      min={0}
                      max={4}
                      low={1}
                      high={3}
                      optimum={4}
                      aria-label="Password strength"
                    />
                    <output
                      htmlFor="reg-password"
                      style={{
                        fontSize: '0.85rem',
                        color: ['', 'var(--danger)', 'var(--accent)', 'var(--success)', 'var(--success)'][pwScore],
                      }}
                      data-testid="pw-strength-output"
                    >
                      {pwScore > 0 ? pwStrengthLabel(pwScore) : ''}
                    </output>
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-confirm-password">Confirm Password</label>
                    <input
                      id="reg-confirm-password"
                      type="password"
                      required
                      value={regData.confirm_password}
                      onChange={e => updateReg('confirm_password', e.target.value)}
                      data-testid="reg-confirm-password-input"
                    />
                  </div>
                  <details>
                    <summary>Password Requirements</summary>
                    <ul className="pw-requirements" role="list">
                      {pwReqs.map((req, i) => (
                        <li key={i} role="listitem" style={{ color: req.met ? 'var(--success)' : 'var(--text-muted)' }}>
                          {req.met ? '✓' : '○'} {req.label}
                        </li>
                      ))}
                    </ul>
                  </details>
                  <div className="step-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setRegStep(1)} data-testid="reg-step2-back-btn">
                      &larr; Back
                    </button>
                    <button type="button" className="btn" onClick={() => setRegStep(3)} data-testid="reg-step2-next-btn">
                      Continue &rarr;
                    </button>
                  </div>
                </fieldset>
              )}

              {regStep === 3 && (
                <fieldset>
                  <legend>Preferences</legend>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={regData.newsletter}
                        onChange={e => updateReg('newsletter', e.target.checked)}
                        data-testid="newsletter-checkbox"
                      />
                      {' '}Subscribe to newsletter for exclusive deals
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        required
                        checked={regData.accept_terms}
                        onChange={e => updateReg('accept_terms', e.target.checked)}
                        data-testid="reg-terms-checkbox"
                      />
                      {' '}I accept the <a href="/terms">Terms &amp; Conditions</a> and <a href="/privacy">Privacy Policy</a>
                    </label>
                  </div>
                  <div className="step-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setRegStep(2)} data-testid="reg-step3-back-btn">
                      &larr; Back
                    </button>
                    <button type="submit" className="btn" disabled={regLoading} data-testid="register-submit-btn">
                      {regLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                    <button type="reset" className="btn btn-ghost" onClick={() => { setRegStep(1); setRegData({ username: '', email: '', phone: '', first_name: '', last_name: '', birthdate: '', website: '', bio: '', gender: '', language: 'en', country: '', password: '', confirm_password: '', newsletter: false, accept_terms: false }) }} data-testid="reg-reset-btn">
                      Clear
                    </button>
                  </div>
                </fieldset>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
