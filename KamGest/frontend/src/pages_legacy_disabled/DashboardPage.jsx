import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/useAuth.js'
import { useLanguage } from '../context/useLanguage.js'
import { listActivityLogs } from '../services/activityLogService.js'
import { getDashboardStats } from '../services/salesService.js'
import { listUsers } from '../services/userService.js'

function DashboardPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const statsPromise = getDashboardStats()
        const userPromise = user?.is_staff ? listUsers() : Promise.resolve([])
        const logPromise = user?.is_staff ? listActivityLogs() : Promise.resolve([])
        const [statsResult, usersResult, logsResult] = await Promise.all([statsPromise, userPromise, logPromise])
        setStats(statsResult)
        setUsers(usersResult)
        setLogs(logsResult)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.is_staff])

  const formatNumber = new Intl.NumberFormat(language === 'en' ? 'en-US' : 'fr-FR', {
    maximumFractionDigits: 0,
  })

  const kpis = stats
    ? [
        { label: 'Chiffre d affaires total', value: `${formatNumber.format(Number(stats.revenue_total || 0))} GNF`, accent: 'dashboard-kpi-accent-primary', icon: '💰' },
        { label: 'Ventes du jour', value: `${formatNumber.format(Number(stats.sales_today_total || 0))} GNF`, accent: 'dashboard-kpi-accent-blue', icon: '📈' },
        { label: 'Articles en stock faible', value: stats.low_stock_count, accent: 'dashboard-kpi-accent-green', icon: '📦' },
        { label: 'Livraisons en attente', value: stats.pending_deliveries_count, accent: 'dashboard-kpi-accent-gold', icon: '🚚' },
      ]
    : []

  const filteredRecentOrders = useMemo(() => {
    const recentOrders = stats?.recent_orders || []
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
      return recentOrders
    }
    return recentOrders.filter((order) =>
      [order.number, order.customer_name, order.status]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [searchTerm, stats])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
      return users.slice(0, 5)
    }
    return users
      .filter((member) =>
        [member.username, member.email, member.first_name, member.last_name]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      )
      .slice(0, 5)
  }, [searchTerm, users])

  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
      return logs.slice(0, 5)
    }
    return logs
      .filter((log) =>
        [log.action, log.description, log.entity_type, log.username]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      )
      .slice(0, 5)
  }, [logs, searchTerm])

  const userInitials = (user?.username || 'U').slice(0, 2).toUpperCase()

  return (
    <div className="dashboard-shell">
      <section className="dashboard-topbar panel">
        <div className="search-container">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            type="search"
            placeholder="Rechercher dans le dashboard..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="dashboard-topbar-right">
          <Link className="button" to="/orders">
            Nouvelle vente
          </Link>
          <div className="dashboard-profile">
            <div className="dashboard-avatar">{userInitials}</div>
            <div>
              <strong>{user?.username || t('common.user')}</strong>
              <p className="muted">{user?.email || t('common.noEmail')}</p>
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <section className="dashboard-kpi-grid">
        {kpis.map((stat) => (
          <article key={stat.label} className={`dashboard-kpi-card ${stat.accent} dashboard-card-enhanced`}>
            <div className="dashboard-kpi-icon">{stat.icon}</div>
            <div className="dashboard-kpi-content">
              <strong className="dashboard-kpi-value">{stat.value}</strong>
              <p className="dashboard-kpi-label">{stat.label}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="detail-grid admin-panels-grid">
        <section className="panel ticket-detail-panel">
          <h3>Commandes recentes</h3>
          {loading ? (
            <div className="panel-inline-message">{t('common.loading')}</div>
          ) : filteredRecentOrders.length ? (
            <div className="stack-list">
              {filteredRecentOrders.map((order) => (
                <div key={order.id} className="list-row">
                  <div>
                    <strong>{order.number}</strong>
                    <p className="muted">{order.customer_name}</p>
                  </div>
                  <span className="muted">{order.total} GNF</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-inline-message">Aucune commande recente.</div>
          )}
        </section>

        <section className="panel ticket-detail-panel">
          <h3>Vue metier</h3>
          <div className="stack-list">
            <div className="list-row">
              <div>
                <strong>Catalogue</strong>
                <p className="muted">{stats?.products_count || 0} article(s)</p>
              </div>
              <Link className="button button-secondary button-small button-compact" to="/products">
                Ouvrir
              </Link>
            </div>
            <div className="list-row">
              <div>
                <strong>Clients</strong>
                <p className="muted">{stats?.customers_count || 0} client(s)</p>
              </div>
              <Link className="button button-secondary button-small button-compact" to="/customers">
                Ouvrir
              </Link>
            </div>
            <div className="list-row">
              <div>
                <strong>Commandes</strong>
                <p className="muted">{stats?.orders_count || 0} commande(s)</p>
              </div>
              <Link className="button button-secondary button-small button-compact" to="/orders">
                Ouvrir
              </Link>
            </div>
            <div className="list-row">
              <div>
                <strong>Livraisons</strong>
                <p className="muted">{stats?.pending_deliveries_count || 0} en attente</p>
              </div>
              <Link className="button button-secondary button-small button-compact" to="/deliveries">
                Ouvrir
              </Link>
            </div>
          </div>
        </section>
      </div>

      {user?.is_staff ? (
        <div className="detail-grid admin-panels-grid">
          <section className="panel ticket-detail-panel">
            <h3>Utilisateurs recents</h3>
            {filteredUsers.length ? (
              <div className="stack-list">
                {filteredUsers.map((member) => (
                  <div key={member.id} className="list-row">
                    <div>
                      <strong>{member.username}</strong>
                      <p className="muted">{member.email || t('common.noEmail')}</p>
                    </div>
                    <span className="muted">{member.is_staff ? 'Staff' : 'Utilisateur'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel-inline-message">Aucun utilisateur trouve.</div>
            )}
          </section>

          <section className="panel ticket-detail-panel">
            <h3>Activite recente</h3>
            {filteredLogs.length ? (
              <div className="stack-list">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="list-row">
                    <div>
                      <strong>{log.action}</strong>
                      <p className="muted">{log.description}</p>
                    </div>
                    <span className="muted">{log.username || t('common.system')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel-inline-message">Aucune activite recente.</div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default DashboardPage
