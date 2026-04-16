import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute.jsx'
import ActivityLogsPage from './pages/ActivityLogsPage.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import AdminPanelPage from './pages/AdminPanelPage.jsx'
import CustomersPage from './pages/CustomersPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import DeliveriesPage from './pages/DeliveriesPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OrderDetailPage from './pages/OrderDetailPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import UserManagementPage from './pages/UserManagementPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/users" element={<ProtectedRoute requireStaff />}>
            <Route index element={<UserManagementPage />} />
          </Route>
          <Route path="/activity-logs" element={<ProtectedRoute requireStaff />}>
            <Route index element={<ActivityLogsPage />} />
          </Route>
          <Route path="/admin-panel" element={<ProtectedRoute requireStaff />}>
            <Route index element={<AdminPanelPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
