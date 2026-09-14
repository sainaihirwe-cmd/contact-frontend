import { useState, useEffect } from 'preact/hooks'
import { apiUrl } from '../api'
import '../styles/ProductDashboard.css'

export function ProductDashboard({ userName, userRole, onLogout }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add', 'edit', 'delete'
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    image: null,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [userRole])

  const fetchProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Please log in to view products.')
        onLogout()
        return
      }

      const res = await fetch(apiUrl('/api/products'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          setError('Session expired. Please login again.')
          onLogout()
          return
        }
        setError(data.message || 'Failed to fetch products')
        return
      }
      setProducts(data.data || [])
    } catch (err) {
      setError('Unable to reach server')
    } finally {
      setLoading(false)
    }
  }

  const handleAddClick = () => {
    setModalMode('add')
    setFormData({ name: '', description: '', price: '', quantity: '', category: '', image: null })
    setSelectedProduct(null)
    setShowModal(true)
  }

  const handleEditClick = (product) => {
    setModalMode('edit')
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
    })
    setShowModal(true)
  }

  const handleDeleteClick = (product) => {
    setModalMode('delete')
    setSelectedProduct(product)
    setShowModal(true)
  }

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('authToken')
      let url = apiUrl('/api/products')
      let method = 'POST'

      if (modalMode === 'edit') {
        url = apiUrl(`/api/products/${selectedProduct._id}`)
        method = 'PUT'
      }

      // Create FormData to handle file upload
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('price', formData.price)
      formDataToSend.append('quantity', formData.quantity)
      formDataToSend.append('category', formData.category)
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formDataToSend,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to save product')
        setSubmitting(false)
        return
      }

      // Clear form and close modal
      setFormData({ name: '', description: '', price: '', quantity: '', category: '', image: null })
      setShowModal(false)
      setSelectedProduct(null)
      
      // Refresh product list to show the newly created/updated product
      await fetchProducts()
      
    } catch (err) {
      setError('Unable to save product. Please try again.')
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(apiUrl(`/api/products/${selectedProduct._id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Failed to delete product')
        setSubmitting(false)
        return
      }

      // Close modal and refresh list
      setShowModal(false)
      setSelectedProduct(null)
      
      // Refresh product list to remove the deleted product
      await fetchProducts()
      
    } catch (err) {
      setError('Unable to delete product. Please try again.')
      setSubmitting(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedProduct(null)
    setFormData({ name: '', description: '', price: '', quantity: '', category: '' })
  }

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-navbar">
        <div className="dashboard-navbar-container">
          <div className="navbar-logo">
            <span className="logo-text">ContactHub</span>
          </div>
          <div className="dashboard-user-info">
            <span className="user-name">Welcome, {userName}!</span>
            <span className="user-role">Role: {userRole}</span>
            <button className="btn-logout" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Product List</h1>
          <button className="btn-add-product" onClick={handleAddClick}>+ Add New Product</button>
        </div>

        {loading && <div className="loading">Loading products...</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="products-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product._id} className="product-card">
                <h3>{product.name}</h3>
                <p className="product-category">{product.category}</p>
                <p className="product-description">{product.description}</p>
                <p className="product-price">${product.price}</p>
                <p className="product-stock">Stock: {product.quantity}</p>
                
                {/* User tracking information */}
                <div className="product-meta">
                  <p className="product-created-by">
                    Created by: <strong>{product.createdByName}</strong> ({product.createdByRole})
                  </p>
                  <p className="product-created-at">
                    {new Date(product.createdAt).toLocaleDateString()} {new Date(product.createdAt).toLocaleTimeString()}
                  </p>
                  {product.updatedByName && (
                    <>
                      <p className="product-updated-by">
                        Updated by: <strong>{product.updatedByName}</strong> ({product.updatedByRole})
                      </p>
                      <p className="product-updated-at">
                        {new Date(product.updatedAt).toLocaleDateString()} {new Date(product.updatedAt).toLocaleTimeString()}
                      </p>
                    </>
                  )}
                </div>

                {userRole === 'admin' && (
                  <div className="admin-actions">
                    <button className="btn-edit" onClick={() => handleEditClick(product)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDeleteClick(product)}>Delete</button>
                  </div>
                )}
                {userRole !== 'admin' && (
                  <button className="btn-add-cart">Add to Cart</button>
                )}
              </div>
            ))
          ) : (
            <p className="no-products">No products available</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {modalMode === 'delete' ? (
              <>
                <h2>Delete Product</h2>
                <p>Are you sure you want to delete <strong>{selectedProduct.name}</strong>?</p>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={closeModal}>Cancel</button>
                  <button className="btn-delete-confirm" onClick={handleDelete} disabled={submitting}>
                    {submitting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>{modalMode === 'add' ? 'Add New Product' : 'Edit Product'}</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Product Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter product description"
                      rows="3"
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label htmlFor="price">Price</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter price"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="quantity">Quantity</label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter quantity"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter category (e.g., Electronics, Clothing)"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="image">Product Image</label>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      onChange={handleInputChange}
                      accept="image/*"
                      placeholder="Upload product image"
                    />
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={submitting}>
                      {submitting ? 'Saving...' : (modalMode === 'add' ? 'Add Product' : 'Update Product')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}