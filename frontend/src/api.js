const BASE = '/api'

const api = {
  get: (path) =>
    fetch(BASE + path).then(r => r.json()),

  post: (path, body) =>
    fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json()),

  put: (path, body) =>
    fetch(BASE + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json()),

  delete: (path) =>
    fetch(BASE + path, { method: 'DELETE' }).then(r => r.json()),

  authGet: (path, token) =>
    fetch(BASE + path, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),

  authPost: (path, body, token) =>
    fetch(BASE + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then(r => r.json()),

  authPut: (path, body, token) =>
    fetch(BASE + path, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then(r => r.json()),
}

export default api
