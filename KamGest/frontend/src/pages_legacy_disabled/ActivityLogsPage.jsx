import { useEffect, useMemo, useState } from 'react'

import PageHeader from '../components/PageHeader.jsx'
import { useLanguage } from '../context/useLanguage.js'
import { exportActivityLogsExcel, listActivityLogs } from '../services/activityLogService.js'

function ActivityLogsPage() {
  const { language, t } = useLanguage()
  const [logs, setLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [exporting, setExporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await listActivityLogs()
        setLogs(data)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [])

  async function handleExport() {
    setExporting(true)
    setError('')

    try {
      await exportActivityLogsExcel()
    } catch (exportError) {
      setError(exportError.message)
    } finally {
      setExporting(false)
    }
  }

  const stats = useMemo(() => {
    const loginEvents = logs.filter((item) => item.action.startsWith('login')).length
    const salesEvents = logs.filter((item) => ['order', 'delivery', 'product', 'customer'].includes(item.entity_type)).length
    const userEvents = logs.filter((item) => item.entity_type === 'user').length

    return [
      { label: t('logs.totalLogs'), value: logs.length, hint: 'Evenements traces par le backend', accent: 'dashboard-kpi-accent-primary' },
      { label: t('logs.logins'), value: loginEvents, hint: 'Succes et echecs de connexion', accent: 'dashboard-kpi-accent-blue' },
      { label: 'Actions vente', value: salesEvents, hint: 'Produits, clients, commandes et livraisons', accent: 'dashboard-kpi-accent-green' },
      { label: t('logs.userActions'), value: userEvents, hint: 'Gestion des comptes', accent: 'dashboard-kpi-accent-gold' },
    ]
  }, [logs, t])

  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return logs
    }

    return logs.filter((item) =>
      [
        item.action,
        item.username,
        item.entity_type,
        item.description,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [logs, searchTerm])

  return (
    <div className="content-stack logs-page-shell">
      <PageHeader
        title={t('logs.title')}
        description=""
        actions={
          <button className="button button-secondary" type="button" onClick={handleExport} disabled={exporting}>
            {exporting ? t('common.exportShort') : t('common.export')}
          </button>
        }
      />

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <section className="panel user-toolbar-panel">
        <div className="user-toolbar-copy">
          <p className="eyebrow">{t('logs.audit')}</p>
          <h3>{t('logs.journal')}</h3>
        </div>
        <label className="dashboard-search user-search-field" htmlFor="logs-search">
          <span className="dashboard-search-icon">⌕</span>
          <input
            id="logs-search"
            type="search"
            placeholder={t('logs.searchPlaceholder')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
      </section>

      <section className="dashboard-kpi-grid user-kpi-grid">
        {stats.map((stat) => (
          <article key={stat.label} className={`dashboard-kpi-card ${stat.accent}`}>
            <div className="dashboard-kpi-icon">{String(stat.value).slice(0, 1)}</div>
            <div>
              <strong className="dashboard-kpi-value">{stat.value}</strong>
              <p className="dashboard-kpi-label">{stat.label}</p>
              <p className="muted user-kpi-hint">{stat.hint}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="panel ticket-info-strip">
        <div>
          <strong>{t('logs.activeSearch')}</strong>
        </div>
        <div>
          <strong>{t('logs.export')}</strong>
        </div>
      </section>

      <section className="panel table-panel">
        {loading ? (
          <div className="panel-inline-message panel-padding">{t('logs.loadingLogs')}</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('logs.date')}</th>
                  <th>{t('logs.action')}</th>
                  <th>{t('logs.user')}</th>
                  <th>{t('logs.entity')}</th>
                  <th>{t('logs.description')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.created_at).toLocaleString(language === 'en' ? 'en-US' : 'fr-FR')}</td>
                    <td>{item.action}</td>
                    <td>{item.username}</td>
                    <td>
                      {item.entity_type}
                      {item.entity_id ? ` #${item.entity_id}` : ''}
                    </td>
                    <td>{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default ActivityLogsPage
