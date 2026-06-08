import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { isStatic } from '../api'

const CartContext = createContext(null)

function generateSessionId() {
  return 'cart-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function loadStaticCart() {
  const raw = localStorage.getItem('static_cart')
  return raw ? JSON.parse(raw) : { items: [], subtotal: 0, item_count: 0 }
}

function saveStaticCart(cart) {
  localStorage.setItem('static_cart', JSON.stringify(cart))
  return cart
}

function calcStaticCart(items) {
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  return { items, subtotal: Math.round(subtotal * 100) / 100, item_count: items.reduce((s, i) => s + i.quantity, 0) }
}

export function CartProvider({ children }) {
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('cart_session_id')
    if (!id) { id = generateSessionId(); localStorage.setItem('cart_session_id', id) }
    return id
  })

  const [cart, setCart] = useState({ items: [], subtotal: 0, item_count: 0 })

  const fetchCart = useCallback(async () => {
    if (isStatic) { setCart(loadStaticCart()); return }
    try {
      const data = await api.get(`/cart/${sessionId}`)
      setCart(data)
    } catch (e) {
      console.error('Failed to fetch cart', e)
    }
  }, [sessionId])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addToCart = useCallback(async (product, quantity = 1) => {
    if (isStatic) {
      const current = loadStaticCart()
      const existing = current.items.find(i => i.product_id === (product.id || product))
      if (existing) {
        existing.quantity += quantity
      } else {
        current.items.push({
          id: Date.now(),
          product_id: product.id || product,
          quantity,
          unit_price: product.price || 0,
          product: product.id ? product : null,
        })
      }
      const updated = calcStaticCart(current.items)
      setCart(saveStaticCart(updated))
      return updated
    }
    const productId = product.id || product
    const data = await api.post(`/cart/${sessionId}/items`, { product_id: productId, quantity })
    setCart(data)
    return data
  }, [sessionId])

  const removeFromCart = useCallback(async (itemId) => {
    if (isStatic) {
      const current = loadStaticCart()
      const updated = calcStaticCart(current.items.filter(i => i.id !== itemId))
      setCart(saveStaticCart(updated))
      return updated
    }
    const data = await api.delete(`/cart/${sessionId}/items/${itemId}`)
    setCart(data)
    return data
  }, [sessionId])

  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (isStatic) {
      const current = loadStaticCart()
      const item = current.items.find(i => i.id === itemId)
      if (item) item.quantity = quantity
      const updated = calcStaticCart(current.items)
      setCart(saveStaticCart(updated))
      return updated
    }
    const data = await api.put(`/cart/${sessionId}/items/${itemId}`, { quantity })
    setCart(data)
    return data
  }, [sessionId])

  const clearCart = useCallback(async () => {
    if (isStatic) {
      const empty = { items: [], subtotal: 0, item_count: 0 }
      setCart(saveStaticCart(empty))
      return empty
    }
    const data = await api.delete(`/cart/${sessionId}`)
    setCart(data)
    return data
  }, [sessionId])

  return (
    <CartContext.Provider value={{
      cart: cart.items || [],
      cartTotal: cart.subtotal || 0,
      itemCount: cart.item_count || 0,
      sessionId,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
