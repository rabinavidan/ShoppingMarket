import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import { useCart } from '../context/CartContext'
import QuickViewDialog from '../components/dialogs/QuickViewDialog'
import './Products.css'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [compareList, setCompareList] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const { addToCart } = useCart()
  const navigate = useNavigate()

  const currentPage = parseInt(searchParams.get('page') || '1')
  const currentCategory = searchParams.get('category_id') || ''
  const currentSort = searchParams.get('sort') || 'newest'
  const currentQ = searchParams.get('q') || ''
  const currentMinPrice = searchParams.get('min_price') || ''
  const currentMaxPrice = searchParams.get('max_price') || '1000'

  const fetchProducts = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (currentQ) params.set('q', currentQ)
    if (currentCategory) params.set('category_id', currentCategory)
    if (currentMinPrice) params.set('min_price', currentMinPrice)
    if (currentMaxPrice) params.set('max_price', currentMaxPrice)
    params.set('sort', currentSort)
    params.set('page', currentPage)
    params.set('per_page', '12')

    api.get(`/products?${params.toString()}`)
      .then(data => {
        setProducts(data.data || [])
        setTotal(data.total || 0)
        setPages(data.pages || 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [currentQ, currentCategory, currentSort, currentPage, currentMinPrice, currentMaxPrice])

  useEffect(() => {
    api.get('/categories').then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  function handleFilterSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const params = {}
    const catIds = fd.getAll('category_id')
    if (catIds.length === 1) params.category_id = catIds[0]
    const sort = fd.get('sort') || 'newest'
    params.sort = sort
    const maxPrice = fd.get('max_price')
    if (maxPrice) params.max_price = maxPrice
    const q = fd.get('q')
    if (q) params.q = q
    params.page = '1'
    setSearchParams(params)
  }

  function handleFilterReset() {
    setSearchParams({})
  }

  function toggleCompare(product) {
    setCompareList(prev => {
      const exists = prev.find(p => p.id === product.id)
      if (exists) return prev.filter(p => p.id !== product.id)
      if (prev.length >= 3) return prev
      return [...prev, product]
    })
  }

  function renderStars(rating) {
    if (!rating) return '☆☆☆☆☆'
    const full = Math.floor(rating)
    return '★'.repeat(full) + '☆'.repeat(5 - full)
  }

  return (
    <div className="products-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb" role="list">
            <li role="listitem"><Link to="/">Home</Link></li>
            <li role="listitem" aria-current="page">Products</li>
          </ol>
        </nav>

        <div className="products-layout">
          {/* Filter Sidebar */}
          <aside className="filter-sidebar" aria-label="Product filters">
            <form
              id="filter-form"
              onSubmit={handleFilterSubmit}
              onReset={handleFilterReset}
              aria-label="Filter products"
            >
              <h3>Filters</h3>

              <fieldset>
                <legend>Search</legend>
                <div className="form-group">
                  <label htmlFor="product-search-input">Search products</label>
                  <input
                    id="product-search-input"
                    type="text"
                    name="q"
                    defaultValue={currentQ}
                    list="product-search-list"
                    placeholder="e.g. headphones"
                    data-testid="products-search-input"
                  />
                  <datalist id="product-search-list">
                    {products.map(p => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                </div>
              </fieldset>

              <fieldset>
                <legend>Category</legend>
                {categories.map(cat => (
                  <div key={cat.id} className="checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        name="category_id"
                        value={cat.id}
                        defaultChecked={currentCategory === String(cat.id)}
                        data-testid={`category-filter-${cat.id}`}
                      />
                      {' '}{cat.name}
                    </label>
                  </div>
                ))}
              </fieldset>

              <fieldset>
                <legend>Price Range</legend>
                <div className="form-group">
                  <label htmlFor="price-range">
                    Max price: <output htmlFor="price-range" id="price-range-output">
                      ${currentMaxPrice || 1000}
                    </output>
                  </label>
                  <input
                    type="range"
                    id="price-range"
                    name="max_price"
                    min="0"
                    max="1000"
                    step="10"
                    defaultValue={currentMaxPrice || 1000}
                    data-testid="price-range-input"
                    onChange={e => {
                      const out = document.getElementById('price-range-output')
                      if (out) out.textContent = `$${e.target.value}`
                    }}
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend>Sort By</legend>
                <div className="radio-group">
                  {[
                    { value: 'newest', label: 'Newest' },
                    { value: 'price_asc', label: 'Price: Low to High' },
                    { value: 'price_desc', label: 'Price: High to Low' },
                    { value: 'rating', label: 'Top Rated' },
                  ].map(opt => (
                    <label key={opt.value} className="radio-label">
                      <input
                        type="radio"
                        name="sort"
                        value={opt.value}
                        defaultChecked={currentSort === opt.value}
                        data-testid={`sort-radio-${opt.value}`}
                      />
                      {' '}{opt.label}
                    </label>
                  ))}
                </div>
                <div className="form-group mt-2">
                  <label htmlFor="sort-select">Sort (dropdown)</label>
                  <select id="sort-select" name="sort_select" data-testid="sort-select">
                    <optgroup label="By Date">
                      <option value="newest">Newest First</option>
                    </optgroup>
                    <optgroup label="By Price">
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </optgroup>
                    <optgroup label="By Popularity">
                      <option value="rating">Top Rated</option>
                    </optgroup>
                  </select>
                </div>
              </fieldset>

              <div className="filter-actions">
                <button type="submit" className="btn" data-testid="apply-filters-btn">
                  Apply Filters
                </button>
                <button type="reset" className="btn btn-ghost" data-testid="reset-filters-btn">
                  Reset
                </button>
              </div>
            </form>
          </aside>

          {/* Products Grid */}
          <div className="products-main">
            <div className="products-header flex-between mb-2">
              <p className="results-count text-muted">
                {total} product{total !== 1 ? 's' : ''} found
              </p>
              {compareList.length > 0 && (
                <span className="badge badge-primary">
                  {compareList.length} selected for comparison
                </span>
              )}
            </div>

            {loading ? (
              <div className="loading" role="status" aria-live="polite">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="empty-state text-center">
                <p>No products found. Try adjusting your filters.</p>
                <Link to="/products" className="btn btn-outline mt-2">Clear Filters</Link>
              </div>
            ) : (
              <div className="products-grid grid grid-auto" role="list">
                {products.map(product => (
                  <article
                    key={product.id}
                    className="product-card card"
                    role="listitem"
                    data-testid={`product-card-${product.id}`}
                  >
                    <figure
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <img
                        src={product.image_url || 'https://placehold.co/400x300?text=Product'}
                        alt={product.name}
                        loading="lazy"
                      />
                      <figcaption className="sr-only">{product.name}</figcaption>
                    </figure>
                    <div className="card-body">
                      {product.is_featured && (
                        <span className="badge badge-accent mb-1">Featured</span>
                      )}
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>
                        <Link to={`/products/${product.id}`} data-testid={`product-link-${product.id}`}>
                          {product.name}
                        </Link>
                      </h3>
                      <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                        {product.description?.slice(0, 70)}...
                      </p>
                      <div className="price-row">
                        <span className="price">${product.price?.toFixed(2)}</span>
                        {product.original_price && (
                          <del className="original-price">${product.original_price?.toFixed(2)}</del>
                        )}
                      </div>
                      <div className="rating-row">
                        <meter
                          value={product.average_rating || 3}
                          min={0}
                          max={5}
                          low={2}
                          high={4}
                          optimum={5}
                          title={`${product.average_rating || 'N/A'} out of 5`}
                        />
                        <span className="stars" aria-label={`Rating: ${product.average_rating || 'N/A'} stars`}>
                          {renderStars(product.average_rating || 3)}
                        </span>
                      </div>
                      <div className="stock-row">
                        <progress
                          value={Math.min(product.stock, 100)}
                          max={100}
                          aria-label={`Stock: ${product.stock}`}
                        />
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                          {product.stock} in stock
                        </span>
                      </div>
                      <div className="card-actions">
                        <button
                          className="btn"
                          onClick={() => addToCart(product.id, 1)}
                          data-testid="add-to-cart-btn"
                          aria-label={`Add ${product.name} to cart`}
                        >
                          Add to Cart
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => setSelectedProduct(product)}
                          data-testid={`quick-view-btn-${product.id}`}
                          aria-label={`Quick view ${product.name}`}
                        >
                          Quick View
                        </button>
                      </div>
                      <label className="compare-label">
                        <input
                          type="checkbox"
                          checked={compareList.some(p => p.id === product.id)}
                          onChange={() => toggleCompare(product)}
                          data-testid={`compare-checkbox-${product.id}`}
                        />
                        {' '}Compare
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <nav className="pagination" aria-label="Product list pagination">
                <button
                  className="btn btn-ghost"
                  disabled={currentPage <= 1}
                  onClick={() => setSearchParams(prev => {
                    const n = new URLSearchParams(prev)
                    n.set('page', String(currentPage - 1))
                    return n
                  })}
                  data-testid="pagination-prev-btn"
                >
                  &larr; Prev
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`btn ${p === currentPage ? '' : 'btn-ghost'}`}
                    onClick={() => setSearchParams(prev => {
                      const n = new URLSearchParams(prev)
                      n.set('page', String(p))
                      return n
                    })}
                    data-testid={`pagination-page-${p}`}
                    aria-current={p === currentPage ? 'page' : undefined}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="btn btn-ghost"
                  disabled={currentPage >= pages}
                  onClick={() => setSearchParams(prev => {
                    const n = new URLSearchParams(prev)
                    n.set('page', String(currentPage + 1))
                    return n
                  })}
                  data-testid="pagination-next-btn"
                >
                  Next &rarr;
                </button>
              </nav>
            )}

            {/* Comparison Table */}
            {compareList.length >= 2 && (
              <section className="comparison-section mt-3" aria-label="Product comparison">
                <h3>Product Comparison</h3>
                <div className="table-wrapper">
                  <table>
                    <caption>Comparing {compareList.length} products</caption>
                    <colgroup>
                      <col style={{ width: '140px' }} />
                      {compareList.map(p => (
                        <col key={p.id} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        <th scope="col">Feature</th>
                        {compareList.map(p => (
                          <th key={p.id} scope="col">{p.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Price</td>
                        {compareList.map(p => (
                          <td key={p.id}>${p.price?.toFixed(2)}</td>
                        ))}
                      </tr>
                      <tr>
                        <td>Category</td>
                        {compareList.map(p => (
                          <td key={p.id}>{p.category?.name || 'N/A'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td>Stock</td>
                        {compareList.map(p => (
                          <td key={p.id}>{p.stock}</td>
                        ))}
                      </tr>
                      <tr>
                        <td>Rating</td>
                        {compareList.map(p => (
                          <td key={p.id}>
                            <meter value={p.average_rating || 3} min={0} max={5} low={2} high={4} optimum={5} />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td>Action</td>
                        {compareList.map(p => (
                          <td key={p.id}>
                            <Link to={`/products/${p.id}`} className="btn" style={{ fontSize: '0.85rem' }}>
                              View
                            </Link>
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {selectedProduct && (
        <QuickViewDialog
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}
