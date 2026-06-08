import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api'

const CartContext = createContext(null)

function generateSessionId() {
  return 'cart-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function CartProvider({ children }) {
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('cart_session_id')
    if (!id) {
      id = generateSessionId()
      localStorage.setItem('cart_session_id', id)
    }
    return id
  })

  const [cart, setCart] = useState({ items: [], subtotal: 0, item_count: 0 })

  const fetchCart = useCallback(async () => {
    try {
      const data = await api.get(`/cart/${sessionId}`)
      setCart(data)
    } catch (e) {
      console.error('Failed to fetch cart', e)
    }
  }, [sessionId])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const addToCart = useCallback(async (productId, quantity = 1) => {
    const data = await api.post(`/cart/${sessionId}/items`, { product_id: productId, quantity })
    setCart(data)
    return data
  }, [sessionId])

  const removeFromCart = useCallback(async (itemId) => {
    const data = await api.delete(`/cart/${sessionId}/items/${itemId}`)
    setCart(data)
    return data
  }, [sessionId])

  const updateQuantity = useCallback(async (itemId, quantity) => {
    const data = await api.put(`/cart/${sessionId}/items/${itemId}`, { quantity })
    setCart(data)
    return data
  }, [sessionId])

  const clearCart = useCallback(async () => {
    const data = await api.delete(`/cart/${sessionId}`)
    setCart(data)
    return data
  }, [sessionId])

  const cartTotal = cart.subtotal || 0
  const itemCount = cart.item_count || 0

  return (
    <CartContext.Provider value={{
      cart: cart.items || [],
      cartTotal,
      itemCount,
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
