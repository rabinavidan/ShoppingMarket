const LIVE_BASE = '/api'
// BASE_URL is '/' in dev and '/ShoppingMarket/' on GitHub Pages (set by vite base)
const STATIC_BASE = import.meta.env.BASE_URL + 'api'

export const isStatic = import.meta.env.VITE_STATIC_MODE === 'true'

// Strip query params and resolve to a .json file path for static mode
function staticPath(path) {
  const base = path.split('?')[0].replace(/\/$/, '')
  return `${STATIC_BASE}${base}.json`
}

async function staticGet(path) {
  const url = staticPath(path)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Static fetch failed: ${url}`)
  return res.json()
}

async function liveGet(path) {
  const res = await fetch(LIVE_BASE + path)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

// Mock POST responses for static/GitHub Pages mode
function mockPost(path, body) {
  if (path === '/auth/register') {
    const user = {
      id: Date.now(),
      username: body.username || body.email.split('@')[0],
      email: body.email,
      first_name: body.first_name || '',
      last_name: body.last_name || '',
      phone: body.phone || '',
      bio: body.bio || '',
      avatar_url: '',
      created_at: new Date().toISOString(),
      is_active: true,
    }
    const token = 'static-demo-token-' + btoa(JSON.stringify({ id: user.id, email: user.email }))
    localStorage.setItem('static_user', JSON.stringify(user))
    return Promise.resolve({ access_token: token, token_type: 'bearer', user })
  }

  if (path === '/auth/login') {
    const stored = localStorage.getItem('static_user')
    const user = stored ? JSON.parse(stored) : {
      id: 1, username: 'demo', email: body.email,
      first_name: 'Demo', last_name: 'User',
      phone: '', bio: '', avatar_url: '',
      created_at: new Date().toISOString(), is_active: true,
    }
    const token = 'static-demo-token-' + btoa(JSON.stringify({ id: user.id, email: user.email }))
    return Promise.resolve({ access_token: token, token_type: 'bearer', user })
  }

  if (path.includes('/cart/') && path.includes('/items')) {
    // Cart add — return updated cart from localStorage
    return Promise.resolve(getStaticCart())
  }

  if (path === '/coupons/validate') {
    const codes = { SAVE10: 10, SAVE20: 20, FREESHIP: 0 }
    const discount = codes[body.code?.toUpperCase()]
    if (discount !== undefined) {
      return Promise.resolve({ valid: true, code: body.code.toUpperCase(), discount_percent: discount, free_shipping: body.code.toUpperCase() === 'FREESHIP' })
    }
    return Promise.resolve({ valid: false, detail: 'Invalid coupon code' })
  }

  // Generic: return success stub
  return Promise.resolve({ success: true, detail: 'Demo mode — changes not saved' })
}

// Simple localStorage-backed cart for static mode
function getStaticCart() {
  const raw = localStorage.getItem('static_cart')
  return raw ? JSON.parse(raw) : { items: [], subtotal: 0, item_count: 0 }
}

const api = {
  get: async (path) => {
    if (isStatic) return staticGet(path)
    try {
      return await liveGet(path)
    } catch {
      return staticGet(path)
    }
  },

  post: (path, body) => {
    if (isStatic) return mockPost(path, body)
    return fetch(LIVE_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json())
  },

  put: (path, body) => {
    if (isStatic) return Promise.resolve({ success: true })
    return fetch(LIVE_BASE + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json())
  },

  delete: (path) => {
    if (isStatic) return Promise.resolve({ items: [], subtotal: 0, item_count: 0 })
    return fetch(LIVE_BASE + path, { method: 'DELETE' }).then(r => r.json())
  },

  authGet: (path, token) => {
    if (isStatic && token?.startsWith('static-demo-token-')) {
      const stored = localStorage.getItem('static_user')
      return Promise.resolve(stored ? JSON.parse(stored) : null)
    }
    return fetch(LIVE_BASE + path, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json())
  },

  authPost: (path, body, token) => {
    if (isStatic) return mockPost(path, body)
    return fetch(LIVE_BASE + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then(r => r.json())
  },

  authPut: (path, body, token) => {
    if (isStatic) return Promise.resolve({ success: true })
    return fetch(LIVE_BASE + path, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then(r => r.json())
  },
}

export default api
