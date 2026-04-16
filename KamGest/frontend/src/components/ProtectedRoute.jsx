import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../context/useAuth.js'
import { useLanguage } from '../context/useLanguage.js'

function ProtectedRoute({ requireStaff = false }) {
  const { user, loading, isAuthenticated } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  if (loading) {
    return <div className="standalone-page auth-state">{t('common.loadingSession')}</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requireStaff && !user.is_staff) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
