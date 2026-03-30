import { useEffect, useMemo, useState } from 'react'

import PageHeader from '../components/PageHeader.jsx'
import { createDelivery, listDeliveries, listOrders, updateDelivery } from '../services/salesService.js'

const initialForm = {
  order: '',
  status: 'pending',
  address: '',
  scheduled_for: '',
  notes: '',
}

function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([])
  const [orders, setOrders] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [deliveriesResult, ordersResult] = await Promise.all([listDeliveries(), listOrders()])
      setDeliveries(deliveriesResult)
      setOrders(ordersResult)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function resetForm() {
    setEditingId(null)
    setFormData(initialForm)
  }

  function startEditing(delivery) {
    setEditingId(delivery.id)
    setSuccessMessage('')
    setFormData({
      order: String(delivery.order),
      status: delivery.status,
      address: delivery.address || '',
      scheduled_for: delivery.scheduled_for ? delivery.scheduled_for.slice(0, 16) : '',
      notes: delivery.notes || '',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const payload = {
        order: Number(formData.order),
        status: formData.status,
        address: formData.address.trim(),
        scheduled_for: formData.scheduled_for || null,
        notes: formData.notes.trim(),
      }

      if (editingId) {
        await updateDelivery(editingId, payload)
        setSuccessMessage('Livraison mise a jour.')
      } else {
        await createDelivery(payload)
        setSuccessMessage('Livraison creee.')
      }

      resetForm()
      await loadData()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const availableOrders = useMemo(() => {
    if (editingId) {
      return orders
    }
    const assignedOrderIds = new Set(deliveries.map((delivery) => delivery.order))
    return orders.filter((order) => !assignedOrderIds.has(order.id))
  }, [deliveries, editingId, orders])

  const filteredDeliveries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
      return deliveries
    }
    return deliveries.filter((delivery) =>
      [
        delivery.order_number,
        delivery.status,
        delivery.address,
        delivery.notes,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [deliveries, searchTerm])

  return (
    <div className="content-stack user-page-shell">
      <PageHeader
        title="Livraisons"
        description="Planification des commandes expediees et suivi du statut."
      />

      <section className="panel user-toolbar-panel">
        <div className="user-toolbar-copy">
          <p className="eyebrow">Execution</p>
          <h3>{editingId ? 'Edition de livraison' : 'Suivi des livraisons'}</h3>
        </div>
        <label className="dashboard-search user-search-field" htmlFor="delivery-search">
          <span className="dashboard-search-icon">⌕</span>
          <input
            id="delivery-search"
            type="search"
            placeholder="Rechercher une livraison..."
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
              <p className="eyebrow">{editingId ? 'Edition' : 'Nouvelle livraison'}</p>
              <h3>{editingId ? 'Mettre a jour la livraison' : 'Creer une livraison'}</h3>
            </div>
          </div>

          <form className="form-grid form-grid-single user-form-grid" onSubmit={handleSubmit}>
            <label>
              <span>Commande</span>
              <select name="order" value={formData.order} onChange={handleChange} required>
                <option value="">Selectionner</option>
                {availableOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.number} - {order.customer_name}
                  </option>
                ))}
              </select>
            </label>

            <div className="user-form-two-columns">
              <label>
                <span>Statut</span>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="pending">En attente</option>
                  <option value="in_transit">En transit</option>
                  <option value="delivered">Livree</option>
                  <option value="cancelled">Annulee</option>
                </select>
              </label>

              <label>
                <span>Date prevue</span>
                <input name="scheduled_for" type="datetime-local" value={formData.scheduled_for} onChange={handleChange} />
              </label>
            </div>

            <label>
              <span>Adresse</span>
              <input name="address" value={formData.address} onChange={handleChange} required />
            </label>

            <label>
              <span>Notes</span>
              <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} />
            </label>

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
              <p className="eyebrow">Suivi</p>
              <h3>Livraisons en cours</h3>
            </div>
            <span className="muted">{filteredDeliveries.length} resultat(s)</span>
          </div>

          {loading ? (
            <div className="panel-inline-message">Chargement...</div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Commande</th>
                    <th>Statut</th>
                    <th>Adresse</th>
                    <th>Date prevue</th>
                    <th>Date livree</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id}>
                      <td>{delivery.order_number}</td>
                      <td>{delivery.status}</td>
                      <td>{delivery.address}</td>
                      <td>{delivery.scheduled_for ? new Date(delivery.scheduled_for).toLocaleString('fr-FR') : '-'}</td>
                      <td>{delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleString('fr-FR') : '-'}</td>
                      <td>
                        <button className="button button-secondary button-small button-compact" type="button" onClick={() => startEditing(delivery)}>
                          Modifier
                        </button>
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

export default DeliveriesPage
