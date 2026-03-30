import { useEffect, useMemo, useRef, useState } from 'react'

import PageHeader from '../components/PageHeader.jsx'
import {
  createCustomer,
  deleteCustomer,
  downloadCustomerTemplateCsv,
  downloadCustomerTemplateExcel,
  exportCustomersExcel,
  importCustomersSpreadsheet,
  listCustomers,
  updateCustomer,
} from '../services/salesService.js'

const initialForm = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  notes: '',
}

function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    setError('')
    try {
      const data = await listCustomers()
      setCustomers(data)
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

  function startEditing(customer) {
    setEditingId(customer.id)
    setSuccessMessage('')
    setFormData({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      notes: customer.notes || '',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        notes: formData.notes.trim(),
      }

      if (editingId) {
        await updateCustomer(editingId, payload)
        setSuccessMessage('Client mis a jour.')
      } else {
        await createCustomer(payload)
        setSuccessMessage('Client cree.')
      }

      resetForm()
      await loadCustomers()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(customer) {
    if (!window.confirm(`Supprimer le client ${customer.full_name} ?`)) {
      return
    }
    setError('')
    setSuccessMessage('')
    try {
      await deleteCustomer(customer.id)
      setSuccessMessage('Client supprime.')
      if (editingId === customer.id) {
        resetForm()
      }
      await loadCustomers()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  async function handleExport() {
    setExporting(true)
    setError('')
    try {
      await exportCustomersExcel()
    } catch (exportError) {
      setError(exportError.message)
    } finally {
      setExporting(false)
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleImportChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    setImporting(true)
    setError('')
    setSuccessMessage('')
    try {
      const result = await importCustomersSpreadsheet(file)
      await loadCustomers()
      setSuccessMessage(`Import termine: ${result.created} cree(s), ${result.updated} mis a jour.`)
    } catch (importError) {
      setError(importError.message)
    } finally {
      event.target.value = ''
      setImporting(false)
    }
  }

  async function handleTemplateDownload(kind) {
    setDownloadingTemplate(kind)
    setError('')
    try {
      if (kind === 'excel') {
        await downloadCustomerTemplateExcel()
      } else {
        await downloadCustomerTemplateCsv()
      }
    } catch (templateError) {
      setError(templateError.message)
    } finally {
      setDownloadingTemplate('')
    }
  }

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
      return customers
    }
    return customers.filter((customer) =>
      [
        customer.full_name,
        customer.phone,
        customer.email,
        customer.address,
        customer.city,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [customers, searchTerm])

  return (
    <div className="content-stack user-page-shell">
      <PageHeader
        title="Clients"
        description="Base clients, coordonnees et adresses de livraison."
        actions={
          <div className="page-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden-input"
              onChange={handleImportChange}
            />
            <button className="button button-secondary" type="button" onClick={handleImportClick} disabled={importing}>
              {importing ? 'Import...' : 'Importer'}
            </button>
            <button className="button button-secondary" type="button" onClick={() => handleTemplateDownload('excel')} disabled={Boolean(downloadingTemplate)}>
              {downloadingTemplate === 'excel' ? 'Modele...' : 'Modele Excel'}
            </button>
            <button className="button button-secondary" type="button" onClick={() => handleTemplateDownload('csv')} disabled={Boolean(downloadingTemplate)}>
              {downloadingTemplate === 'csv' ? 'Modele...' : 'Modele CSV'}
            </button>
            <button className="button button-secondary" type="button" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Export...' : 'Exporter'}
            </button>
          </div>
        }
      />

      <section className="panel user-toolbar-panel">
        <div className="user-toolbar-copy">
          <p className="eyebrow">Relation client</p>
          <h3>{editingId ? 'Edition client' : 'Gestion du portefeuille client'}</h3>
        </div>
        <label className="dashboard-search user-search-field" htmlFor="customer-search">
          <span className="dashboard-search-icon">⌕</span>
          <input
            id="customer-search"
            type="search"
            placeholder="Rechercher un client..."
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
              <p className="eyebrow">{editingId ? 'Edition' : 'Creation'}</p>
              <h3>{editingId ? 'Modifier un client' : 'Creer un client'}</h3>
            </div>
          </div>

          <form className="form-grid form-grid-single user-form-grid" onSubmit={handleSubmit}>
            <div className="user-form-two-columns">
              <label>
                <span>Prenom</span>
                <input name="first_name" value={formData.first_name} onChange={handleChange} required />
              </label>

              <label>
                <span>Nom</span>
                <input name="last_name" value={formData.last_name} onChange={handleChange} required />
              </label>
            </div>

            <div className="user-form-two-columns">
              <label>
                <span>Telephone</span>
                <input name="phone" value={formData.phone} onChange={handleChange} />
              </label>

              <label>
                <span>Email</span>
                <input name="email" type="email" value={formData.email} onChange={handleChange} />
              </label>
            </div>

            <label>
              <span>Adresse</span>
              <input name="address" value={formData.address} onChange={handleChange} />
            </label>

            <label>
              <span>Ville</span>
              <input name="city" value={formData.city} onChange={handleChange} />
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
              <p className="eyebrow">Fichier client</p>
              <h3>Clients enregistres</h3>
            </div>
            <span className="muted">{filteredCustomers.length} resultat(s)</span>
          </div>

          {loading ? (
            <div className="panel-inline-message">Chargement...</div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Telephone</th>
                    <th>Email</th>
                    <th>Ville</th>
                    <th>Adresse</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.full_name}</td>
                      <td>{customer.phone || '-'}</td>
                      <td>{customer.email || '-'}</td>
                      <td>{customer.city || '-'}</td>
                      <td>{customer.address || '-'}</td>
                      <td>
                        <div className="table-actions">
                          <button className="button button-secondary button-small button-compact" type="button" onClick={() => startEditing(customer)}>
                            Modifier
                          </button>
                          <button className="button button-secondary button-small button-compact" type="button" onClick={() => handleDelete(customer)}>
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

export default CustomersPage
