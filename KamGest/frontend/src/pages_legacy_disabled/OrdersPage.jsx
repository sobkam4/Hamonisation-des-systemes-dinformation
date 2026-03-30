import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import PageHeader from '../components/PageHeader.jsx'
import {
  createOrder,
  deleteOrder,
  exportOrdersExcel,
  listCustomers,
  listOrders,
  listProducts,
  updateOrder,
} from '../services/salesService.js'

const initialItem = { product: '', quantity: '1', unit_price: '' }
const initialForm = {
  customer: '',
  status: 'draft',
  payment_method: '',
  delivery_address: '',
  notes: '',
  items: [initialItem],
}

function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [ordersResult, customersResult, productsResult] = await Promise.all([
        listOrders(),
        listCustomers(),
        listProducts(),
      ])
      setOrders(ordersResult)
      setCustomers(customersResult)
      setProducts(productsResult)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setEditingId(null)
    setFormData(initialForm)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function updateItem(index, field, value) {
    setFormData((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item
        }
        const nextItem = { ...item, [field]: value }
        if (field === 'product') {
          const product = products.find((entry) => entry.id === Number(value))
          if (product) {
            nextItem.unit_price = String(product.sale_price)
          }
        }
        return nextItem
      }),
    }))
  }

  function addItem() {
    setFormData((current) => ({ ...current, items: [...current.items, initialItem] }))
  }

  function removeItem(index) {
    setFormData((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function startEditing(order) {
    setEditingId(order.id)
    setSuccessMessage('')
    setFormData({
      customer: String(order.customer),
      status: order.status,
      payment_method: order.payment_method || '',
      delivery_address: order.delivery_address || '',
      notes: order.notes || '',
      items: order.items.length
        ? order.items.map((item) => ({
            product: String(item.product),
            quantity: String(item.quantity),
            unit_price: String(item.unit_price),
          }))
        : [initialItem],
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const payload = {
        customer: Number(formData.customer),
        status: formData.status,
        payment_method: formData.payment_method.trim(),
        delivery_address: formData.delivery_address.trim(),
        notes: formData.notes.trim(),
        items: formData.items.map((item) => ({
          product: Number(item.product),
          quantity: Number(item.quantity),
          unit_price: item.unit_price ? Number(item.unit_price) : undefined,
        })),
      }

      if (editingId) {
        await updateOrder(editingId, payload)
        setSuccessMessage('Commande mise a jour.')
      } else {
        await createOrder(payload)
        setSuccessMessage('Commande creee.')
      }

      resetForm()
      await loadData()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(order) {
    if (!window.confirm(`Supprimer la commande ${order.number} ?`)) {
      return
    }
    setError('')
    setSuccessMessage('')
    try {
      await deleteOrder(order.id)
      setSuccessMessage('Commande supprimee.')
      if (editingId === order.id) {
        resetForm()
      }
      await loadData()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  async function handleExport() {
    setExporting(true)
    setError('')
    try {
      await exportOrdersExcel()
    } catch (exportError) {
      setError(exportError.message)
    } finally {
      setExporting(false)
    }
  }

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
      return orders
    }
    return orders.filter((order) =>
      [
        order.number,
        order.customer_name,
        order.status,
        order.payment_method,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [orders, searchTerm])

  const orderTotalPreview = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0)
      const unitPrice = Number(item.unit_price || 0)
      return sum + quantity * unitPrice
    }, 0)
  }, [formData.items])

  return (
    <div className="content-stack user-page-shell">
      <PageHeader
        title="Commandes"
        description="Saisie des ventes, statut de traitement et lignes d articles."
        actions={
          <div className="page-actions">
            <button className="button button-secondary" type="button" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Export...' : 'Exporter'}
            </button>
          </div>
        }
      />

      <section className="panel user-toolbar-panel">
        <div className="user-toolbar-copy">
          <p className="eyebrow">Ventes</p>
          <h3>{editingId ? 'Edition de commande' : 'Creation de commande'}</h3>
        </div>
        <label className="dashboard-search user-search-field" htmlFor="order-search">
          <span className="dashboard-search-icon">⌕</span>
          <input
            id="order-search"
            type="search"
            placeholder="Rechercher une commande..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
      </section>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}

      <div className="user-management-grid">
        <section className="panel user-form-panel">
          <div className="user-card-header">
            <div>
              <p className="eyebrow">{editingId ? 'Edition' : 'Nouvelle vente'}</p>
              <h3>{editingId ? 'Modifier la commande' : 'Creer une commande'}</h3>
            </div>
            <span className="muted">Total estime: {orderTotalPreview.toFixed(2)} GNF</span>
          </div>

          <form className="form-grid form-grid-single user-form-grid" onSubmit={handleSubmit}>
            <div className="user-form-two-columns">
              <label>
                <span>Client</span>
                <select name="customer" value={formData.customer} onChange={handleChange} required>
                  <option value="">Selectionner</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Statut</span>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="draft">Brouillon</option>
                  <option value="confirmed">Confirmee</option>
                  <option value="delivered">Livree</option>
                  <option value="cancelled">Annulee</option>
                </select>
              </label>
            </div>

            <div className="user-form-two-columns">
              <label>
                <span>Paiement</span>
                <input name="payment_method" value={formData.payment_method} onChange={handleChange} placeholder="Cash, Orange Money..." />
              </label>

              <label>
                <span>Adresse de livraison</span>
                <input name="delivery_address" value={formData.delivery_address} onChange={handleChange} />
              </label>
            </div>

            <label>
              <span>Notes</span>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} />
            </label>

            <div className="panel ticket-info-strip">
              <div>
                <strong>Lignes de commande</strong>
              </div>
              <div>
                <button className="button button-secondary button-small" type="button" onClick={addItem}>
                  Ajouter un article
                </button>
              </div>
            </div>

            {formData.items.map((item, index) => (
              <div key={`${index}-${item.product}`} className="panel">
                <div className="user-form-two-columns">
                  <label>
                    <span>Article</span>
                    <select value={item.product} onChange={(event) => updateItem(index, 'product', event.target.value)} required>
                      <option value="">Selectionner</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.reference} - {product.name} ({product.stock_quantity})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Quantite</span>
                    <input type="number" min="1" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} required />
                  </label>
                </div>

                <div className="user-form-two-columns">
                  <label>
                    <span>Prix unitaire</span>
                    <input type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => updateItem(index, 'unit_price', event.target.value)} required />
                  </label>

                  <label>
                    <span>Sous-total</span>
                    <input value={(Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2)} disabled />
                  </label>
                </div>

                {formData.items.length > 1 ? (
                  <button className="button button-secondary button-small" type="button" onClick={() => removeItem(index)}>
                    Retirer la ligne
                  </button>
                ) : null}
              </div>
            ))}

            <div className="form-actions">
              <button className="button" type="submit" disabled={submitting}>
                {submitting ? 'Enregistrement...' : editingId ? 'Mettre a jour' : 'Creer'}
              </button>
              {editingId ? (
                <button className="button button-secondary" type="button" onClick={resetForm}>
                  Annuler
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="panel user-list-panel">
          <div className="user-card-header">
            <div>
              <p className="eyebrow">Historique</p>
              <h3>Commandes recentes</h3>
            </div>
            <span className="muted">{filteredOrders.length} resultat(s)</span>
          </div>

          {loading ? (
            <div className="panel-inline-message">Chargement...</div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Numero</th>
                    <th>Client</th>
                    <th>Statut</th>
                    <th>Total</th>
                    <th>Creation</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.number}</td>
                      <td>{order.customer_name}</td>
                      <td>
                        <span className={`status-pill status-${order.status === 'confirmed' ? 'used' : order.status === 'cancelled' ? 'expired' : 'unused'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{order.total} GNF</td>
                      <td>{new Date(order.created_at).toLocaleString('fr-FR')}</td>
                      <td>
                        <div className="table-actions">
                          <Link className="button button-secondary button-small button-compact" to={`/orders/${order.id}`}>
                            Voir
                          </Link>
                          <button className="button button-secondary button-small button-compact" type="button" onClick={() => startEditing(order)}>
                            Modifier
                          </button>
                          <button className="button button-secondary button-small button-compact" type="button" onClick={() => handleDelete(order)}>
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default OrdersPage
