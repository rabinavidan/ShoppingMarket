const LIVE_BASE = '/api'
const STATIC_BASE = '/api'  // public/api/*.json served by Pages

const isStatic = import.meta.env.VITE_STATIC_MODE === 'true'

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

const api = {
  get: async (path) => {
    if (isStatic) return staticGet(path)
    try {
      return await liveGet(path)
    } catch {
      // fallback to static JSON when backend is unreachable
      return staticGet(path)
    }
  },

  post: (path, body) =>
    fetch(LIVE_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json()),

  put: (path, body) =>
    fetch(LIVE_BASE + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json()),

  delete: (path) =>
    fetch(LIVE_BASE + path, { method: 'DELETE' }).then(r => r.json()),

  authGet: (path, token) =>
    fetch(LIVE_BASE + path, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),

  authPost: (path, body, token) =>
    fetch(LIVE_BASE + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then(r => r.json()),

  authPut: (path, body, token) =>
    fetch(LIVE_BASE + path, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then(r => r.json()),
}

export default api
