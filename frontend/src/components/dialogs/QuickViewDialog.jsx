import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

export default function QuickViewDialog({ product, onClose }) {
  const dialogRef = useRef(null)
  const { addToCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    if (product && dialogRef.current) {
      dialogRef.current.showModal()
    }
  }, [product])

  function handleClose() {
    dialogRef.current?.close()
    onClose()
  }

  function handleAddToCart() {
    if (product) {
      addToCart(product.id, 1)
      handleClose()
    }
  }

  function handleViewFull() {
    handleClose()
    navigate(`/products/${product.id}`)
  }

  if (!product) return null

  return (
    <dialog
      ref={dialogRef}
      id="quick-view-dialog"
      aria-labelledby="quick-view-title"
      aria-modal="true"
      onClose={handleClose}
    >
      <div className="dialog-header">
        <h2 id="quick-view-title">{product.name}</h2>
        <button
          className="btn btn-ghost dialog-close-btn"
          onClick={handleClose}
          aria-label="Close dialog"
          data-testid="quick-view-close-btn"
        >
          ✕
        </button>
      </div>
      <div className="dialog-body">
        <figure>
          <img
            src={product.image_url || 'https://placehold.co/400x300?text=Product'}
            alt={product.name}
          />
          <figcaption>{product.name}</figcaption>
        </figure>
        <div className="dialog-info">
          <p className="price">
            <ins style={{ textDecoration: 'none', fontWeight: 700, fontSize: '1.3rem', color: 'var(--primary)' }}>
              ${product.price?.toFixed(2)}
            </ins>
            {product.original_price && (
              <del style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>
                ${product.original_price?.toFixed(2)}
              </del>
            )}
          </p>
          <p className="description">{product.description}</p>
          {product.category && (
            <p className="category">
              <strong>Category:</strong> {product.category.name}
            </p>
          )}
          <div className="stock-info">
            <label htmlFor="qv-stock">Stock level:</label>
            <meter
              id="qv-stock"
              value={product.stock}
              min={0}
              max={100}
              low={10}
              high={50}
              optimum={75}
            >
              {product.stock} in stock
            </meter>
            <span>{product.stock} available</span>
          </div>
        </div>
      </div>
      <div className="dialog-footer">
        <button
          className="btn"
          onClick={handleAddToCart}
          data-testid="quick-view-add-to-cart-btn"
        >
          Add to Cart
        </button>
        <button
          className="btn btn-outline"
          onClick={handleViewFull}
          data-testid="quick-view-detail-btn"
        >
          View Full Details
        </button>
        <button
          className="btn btn-ghost"
          onClick={handleClose}
        >
          Cancel
        </button>
      </div>

      <style>{`
        dialog .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        dialog .dialog-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        dialog .dialog-body figure img {
          width: 100%;
          border-radius: 8px;
        }
        dialog .dialog-info { display: flex; flex-direction: column; gap: 0.75rem; }
        dialog .dialog-footer { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        dialog .dialog-close-btn { padding: 0.25rem 0.5rem; }
        dialog .stock-info { display: flex; flex-direction: column; gap: 0.25rem; }
        @media (max-width: 500px) {
          dialog .dialog-body { grid-template-columns: 1fr; }
        }
      `}</style>
    </dialog>
  )
}
