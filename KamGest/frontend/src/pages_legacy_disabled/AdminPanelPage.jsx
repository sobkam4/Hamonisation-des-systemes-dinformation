import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import PageHeader from '../components/PageHeader.jsx'
import { useAuth } from '../context/useAuth.js'
import { useLanguage } from '../context/useLanguage.js'
import { getDashboardStats } from '../services/salesService.js'
import { listUsers } from '../services/userService.js'

function AdminPanelPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [statsData, userData] = await Promise.all([getDashboardStats(), listUsers()])
        setStats(statsData)
        setUsers(userData)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [])

  const summaryCards = useMemo(() => {
    const activeUsers = users.filter((item) => item.is_active).length
    const staffUsers = users.filter((item) => item.is_staff).length

    return [
      { label: 'Utilisateurs', value: users.length, hint: 'Comptes exposes par l API', accent: 'dashboard-kpi-accent-primary' },
      { label: 'Utilisateurs actifs', value: activeUsers, hint: 'Acces autorise a l application', accent: 'dashboard-kpi-accent-blue' },
      { label: 'Comptes staff', value: staffUsers, hint: 'Acces a l administration', accent: 'dashboard-kpi-accent-green' },
      { label: 'Commandes', value: stats?.orders_count || 0, hint: `${stats?.pending_deliveries_count || 0} livraison(s) en attente`, accent: 'dashboard-kpi-accent-gold' },
    ]
  }, [stats, users])

  const recentUsers = useMemo(
    () => [...users].sort((a, b) => new Date(b.date_joined) - new Date(a.date_joined)).slice(0, 5),
    [users],
  )

  return (
    <div className="content-stack admin-page-shell">
      <PageHeader
        title="Administration"
        description="Pilotage des utilisateurs, des ventes et de l exploitation."
        actions={
          <div className="page-actions">
            <Link className="button" to="/users">
              Gerer les utilisateurs
            </Link>
            <Link className="button button-secondary" to="/activity-logs">
              Voir les logs
            </Link>
            <Link className="button button-secondary" to="/orders">
              Voir les commandes
            </Link>
          </div>
        }
      />

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <section className="panel user-toolbar-panel">
        <div className="user-toolbar-copy">
          <p className="eyebrow">Administration</p>
          <h3>Vue de pilotage</h3>
        </div>
      </section>

      <section className="panel admin-hero">
        <div>
          <p className="eyebrow">Compte connecte</p>
          <h3>{user?.username}</h3>
          <p className="muted">
            {user?.email || t('common.noEmail')} {user?.is_superuser ? `| ${t('common.roleSuperuser')}` : `| ${t('common.roleStaff')}`}
          </p>
        </div>
        <div className="admin-hero-actions">
          <a className="button button-secondary" href="/admin/">
            {t('common.openDjangoAdmin')}
          </a>
          <Link className="button button-secondary" to="/dashboard">
            {t('common.backToDashboard')}
          </Link>
        </div>
      </section>

      <section className="dashboard-kpi-grid user-kpi-grid">
        {summaryCards.map((stat) => (
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

      <section className="panel user-info-strip">
        <div>
          <strong>Acces rapide</strong>
        </div>
        <div>
          <strong>Resume</strong>
        </div>
      </section>

      <div className="detail-grid admin-panels-grid">
        <section className="panel ticket-detail-panel">
          <h3>Derniers utilisateurs</h3>
          {loading ? (
            <div className="panel-inline-message">{t('common.loading')}</div>
          ) : recentUsers.length ? (
            <div className="stack-list">
              {recentUsers.map((item) => (
                <div key={item.id} className="list-row">
                  <div>
                    <strong>{item.username}</strong>
                    <p className="muted">{item.email || t('common.noEmail')}</p>
                  </div>
                  <span className={item.is_staff ? 'status-pill status-used' : 'status-pill status-unused'}>
                    {item.is_staff ? t('common.staff').toLowerCase() : t('common.user').toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-inline-message">{t('common.noUsersFound')}</div>
          )}
        </section>

        <section className="panel ticket-detail-panel">
          <h3>Vue metier</h3>
          {loading ? (
            <div className="panel-inline-message">{t('common.loading')}</div>
          ) : stats ? (
            <div className="stack-list">
              <div className="list-row">
                <div>
                  <strong>Catalogue</strong>
                  <p className="muted">{stats.products_count} article(s)</p>
                </div>
                <Link className="button button-secondary button-small button-compact" to="/products">
                  Ouvrir
                </Link>
              </div>
              <div className="list-row">
                <div>
                  <strong>Clients</strong>
                  <p className="muted">{stats.customers_count} client(s)</p>
                </div>
                <Link className="button button-secondary button-small button-compact" to="/customers">
                  Ouvrir
                </Link>
              </div>
              <div className="list-row">
                <div>
                  <strong>Articles en stock faible</strong>
                  <p className="muted">{stats.low_stock_count}</p>
                </div>
                <Link className="button button-secondary button-small button-compact" to="/products">
                  Voir
                </Link>
              </div>
              <div className="list-row">
                <div>
                  <strong>Livraisons</strong>
                  <p className="muted">{stats.pending_deliveries_count} en attente</p>
                </div>
                <Link className="button button-secondary button-small button-compact" to="/deliveries">
                  Ouvrir
                </Link>
              </div>
            </div>
          ) : (
            <div className="panel-inline-message">Aucune statistique disponible.</div>
          )}
        </section>
      </div>
    </div>
  )
}

export default AdminPanelPage
