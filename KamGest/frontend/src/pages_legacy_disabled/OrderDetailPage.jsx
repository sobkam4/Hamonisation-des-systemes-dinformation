import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../components/PageHeader.jsx'
import { deleteOrder, downloadOrderInvoice, getOrder, updateOrder } from '../services/salesService.js'

function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [id])

  async function loadOrder() {
    setLoading(true)
    setError('')
    try {
      const data = await getOrder(id)
      setOrder(data)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadInvoice() {
    setDownloading(true)
    setError('')
    try {
      await downloadOrderInvoice(id)
    } catch (downloadError) {
      setError(downloadError.message)
    } finally {
      setDownloading(false)
    }
  }

  async function handleCancelOrder() {
    if (!order) {
      return
    }
    setError('')
    try {
      await updateOrder(order.id, { status: 'cancelled' })
      await loadOrder()
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  async function handleDeleteOrder() {
    if (!order || !window.confirm(`Supprimer la commande ${order.number} ?`)) {
      return
    }
    setDeleting(true)
    setError('')
    try {
      await deleteOrder(order.id)
      navigate('/orders')
    } catch (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
    }
  }

  return (
    <div className="content-stack ticket-page-shell">
      <PageHeader
        title="Detail commande"
        description={order ? `Commande ${order.number}` : ''}
        actions={
          <div className="page-actions">
            <Link className="button button-secondary" to="/orders">
              Retour a la liste
            </Link>
            {order ? (
              <>
                <button className="button" type="button" onClick={handleDownloadInvoice} disabled={downloading || deleting}>
                  {downloading ? 'Telechargement...' : 'Telecharger la facture'}
                </button>
                {order.status !== 'cancelled' ? (
                  <button className="button button-secondary" type="button" onClick={handleCancelOrder}>
                    Annuler la commande
                  </button>
                ) : null}
                <button className="button button-secondary" type="button" onClick={handleDeleteOrder} disabled={deleting}>
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </>
            ) : null}
          </div>
        }
      />

      {loading ? <div className="panel">Chargement...</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      {order ? (
        <>
          <section className="detail-grid">
            <article className="panel ticket-detail-panel">
              <h3>Informations generales</h3>
              <dl className="detail-list">
                <div>
                  <dt>Numero</dt>
                  <dd>{order.number}</dd>
                </div>
                <div>
                  <dt>Client</dt>
                  <dd>{order.customer_name}</dd>
                </div>
                <div>
                  <dt>Statut</dt>
                  <dd>{order.status}</dd>
                </div>
                <div>
                  <dt>Paiement</dt>
                  <dd>{order.payment_method || '-'}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{order.total} GNF</dd>
                </div>
                <div>
                  <dt>Creation</dt>
                  <dd>{new Date(order.created_at).toLocaleString('fr-FR')}</dd>
                </div>
              </dl>
            </article>

            <article className="panel ticket-detail-panel">
              <h3>Livraison</h3>
              <dl className="detail-list">
                <div>
                  <dt>Adresse</dt>
                  <dd>{order.delivery_address || '-'}</dd>
                </div>
                <div>
                  <dt>Facture MinIO</dt>
                  <dd>{order.invoice_object_name || '-'}</dd>
                </div>
                <div>
                  <dt>Livraison</dt>
                  <dd>{order.delivery ? order.delivery.status : 'Aucune livraison creee'}</dd>
                </div>
                <div>
                  <dt>Notes</dt>
                  <dd>{order.notes || '-'}</dd>
                </div>
              </dl>
            </article>
          </section>

          <section className="panel table-panel">
            <h3>Lignes de commande</h3>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Description</th>
                    <th>Quantite</th>
                    <th>Prix unitaire</th>
                    <th>Sous-total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_reference}</td>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unit_price} GNF</td>
                      <td>{item.subtotal} GNF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

export default OrderDetailPage
