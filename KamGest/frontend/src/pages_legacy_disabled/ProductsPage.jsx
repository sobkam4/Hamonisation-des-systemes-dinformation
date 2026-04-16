import { useEffect, useMemo, useRef, useState } from 'react'

import PageHeader from '../components/PageHeader.jsx'
import {
  createCategory,
  createProduct,
  deleteProduct,
  downloadProductTemplateCsv,
  downloadProductTemplateExcel,
  exportProductsExcel,
  importProductsSpreadsheet,
  listCategories,
  listProducts,
  updateProduct,
} from '../services/salesService.js'

const initialForm = {
  reference: '',
  name: '',
  category: '',
  categoryName: '',
  description: '',
  sale_price: '',
  stock_quantity: '0',
  low_stock_threshold: '5',
  is_active: 'true',
}

function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
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
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [productsResult, categoriesResult] = await Promise.all([listProducts(), listCategories()])
      setProducts(productsResult)
      setCategories(categoriesResult)
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

  function startEditing(product) {
    setEditingId(product.id)
    setSuccessMessage('')
    setFormData({
      reference: product.reference,
      name: product.name,
      category: product.category ? String(product.category) : '',
      categoryName: '',
      description: product.description || '',
      sale_price: String(product.sale_price || ''),
      stock_quantity: String(product.stock_quantity ?? 0),
      low_stock_threshold: String(product.low_stock_threshold ?? 5),
      is_active: String(product.is_active),
    })
  }

  async function ensureCategoryId() {
    if (formData.category) {
      return Number(formData.category)
    }
    if (!formData.categoryName.trim()) {
      return null
    }
    const category = await createCategory({ name: formData.categoryName.trim() })
    setCategories((current) => [...current, category].sort((a, b) => a.name.localeCompare(b.name)))
    return category.id
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const categoryId = await ensureCategoryId()
      const payload = {
        reference: formData.reference.trim(),
        name: formData.name.trim(),
        category: categoryId,
        description: formData.description.trim(),
        sale_price: formData.sale_price,
        stock_quantity: Number(formData.stock_quantity || 0),
        low_stock_threshold: Number(formData.low_stock_threshold || 0),
        is_active: formData.is_active === 'true',
      }

      if (editingId) {
        await updateProduct(editingId, payload)
        setSuccessMessage('Article mis a jour.')
      } else {
        await createProduct(payload)
        setSuccessMessage('Article cree.')
      }

      resetForm()
      await loadData()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Supprimer l'article ${product.reference} ?`)) {
      return
    }
    setError('')
    setSuccessMessage('')
    try {
      await deleteProduct(product.id)
      setSuccessMessage('Article supprime.')
      if (editingId === product.id) {
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
      await exportProductsExcel()
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
      const result = await importProductsSpreadsheet(file)
      await loadData()
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
        await downloadProductTemplateExcel()
      } else {
        await downloadProductTemplateCsv()
      }
    } catch (templateError) {
      setError(templateError.message)
    } finally {
      setDownloadingTemplate('')
    }
  }

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
      return products
    }
    return products.filter((product) =>
      [
        product.reference,
        product.name,
        product.category_name,
        product.description,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [products, searchTerm])

  return (
    <div className="content-stack user-page-shell">
      <PageHeader
        title="Articles"
        description="Catalogue, prix de vente et suivi du stock."
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
          <p className="eyebrow">Catalogue</p>
          <h3>{editingId ? 'Edition d article' : 'Gestion des produits'}</h3>
        </div>
        <label className="dashboard-search user-search-field" htmlFor="product-search">
          <span className="dashboard-search-icon">⌕</span>
          <input
            id="product-search"
            type="search"
            placeholder="Rechercher un article..."
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
              <h3>{editingId ? 'Modifier un article' : 'Creer un article'}</h3>
            </div>
          </div>

          <form className="form-grid form-grid-single user-form-grid" onSubmit={handleSubmit}>
            <label>
              <span>Reference</span>
              <input name="reference" value={formData.reference} onChange={handleChange} required />
            </label>

            <label>
              <span>Nom</span>
              <input name="name" value={formData.name} onChange={handleChange} required />
            </label>

            <div className="user-form-two-columns">
              <label>
                <span>Categorie existante</span>
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="">Aucune</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Nouvelle categorie</span>
                <input name="categoryName" value={formData.categoryName} onChange={handleChange} />
              </label>
            </div>

            <label>
              <span>Description</span>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} />
            </label>

            <div className="user-form-two-columns">
              <label>
                <span>Prix de vente</span>
                <input name="sale_price" type="number" min="0" step="0.01" value={formData.sale_price} onChange={handleChange} required />
              </label>

              <label>
                <span>Stock disponible</span>
                <input name="stock_quantity" type="number" min="0" value={formData.stock_quantity} onChange={handleChange} required />
              </label>
            </div>

            <div className="user-form-two-columns">
              <label>
                <span>Seuil d alerte</span>
                <input name="low_stock_threshold" type="number" min="0" value={formData.low_stock_threshold} onChange={handleChange} required />
              </label>

              <label>
                <span>Actif</span>
                <select name="is_active" value={formData.is_active} onChange={handleChange}>
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </label>
            </div>

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
              <p className="eyebrow">Inventaire</p>
              <h3>Articles disponibles</h3>
            </div>
            <span className="muted">{filteredProducts.length} resultat(s)</span>
          </div>

          {loading ? (
            <div className="panel-inline-message">Chargement...</div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Nom</th>
                    <th>Categorie</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th>Etat</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.reference}</td>
                      <td>{product.name}</td>
                      <td>{product.category_name || '-'}</td>
                      <td>{product.sale_price} GNF</td>
                      <td>{product.stock_quantity}</td>
                      <td>
                        <span className={product.is_low_stock ? 'status-pill status-expired' : 'status-pill status-used'}>
                          {product.is_low_stock ? 'Stock faible' : 'OK'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="button button-secondary button-small button-compact" type="button" onClick={() => startEditing(product)}>
                            Modifier
                          </button>
                          <button className="button button-secondary button-small button-compact" type="button" onClick={() => handleDelete(product)}>
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

export default ProductsPage
