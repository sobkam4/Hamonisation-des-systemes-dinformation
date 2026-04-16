import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Moon, Sun, LogOut, Home, Users, FileText, Settings, Menu, X, Boxes, ShoppingCart, Truck } from 'lucide-react'

import { useAuth } from '../context/useAuth.js'
import { useLanguage } from '../context/useLanguage.js'
import { setStoredLanguage } from '../services/languageService.js'
import { getStoredTheme, setStoredTheme } from '../services/themeService.js'
import NotificationSystem from '../components/NotificationSystem.jsx'

function MainLayout() {
  const { user, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => getStoredTheme())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setStoredTheme(theme)
  }, [theme])

  function toggleMobileMenu() {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false)
  }

  async function handleLogout() {
    try {
      await logout()
      if (window.addNotification) {
        window.addNotification({
          type: 'success',
          title: t('common.success'),
          message: t('auth.logoutSuccess')
        })
      }
      setTimeout(() => navigate('/login'), 1000)
    } catch (error) {
      if (window.addNotification) {
        window.addNotification({
          type: 'danger',
          title: t('common.error'),
          message: t('auth.logoutError')
        })
      }
    }
  }

  function handleToggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
    if (window.addNotification) {
      window.addNotification({
        type: 'info',
        message: theme === 'dark' ? t('common.lightModeEnabled') : t('common.darkModeEnabled')
      })
    }
  }

  function handleChangeLanguage(nextLanguage) {
    setStoredLanguage(nextLanguage)
    setLanguage(nextLanguage)
    if (window.addNotification) {
      window.addNotification({
        type: 'info',
        message: t('common.languageChanged', { lang: nextLanguage.toUpperCase() })
      })
    }
  }

  const userInitials = (user?.username || 'U').slice(0, 2).toUpperCase()

  const navItems = [
    { to: '/dashboard', label: language === 'en' ? 'Dashboard' : 'Dashboard', icon: Home },
    { to: '/products', label: language === 'en' ? 'Products' : 'Articles', icon: Boxes },
    { to: '/customers', label: language === 'en' ? 'Customers' : 'Clients', icon: Users },
    { to: '/orders', label: language === 'en' ? 'Orders' : 'Commandes', icon: ShoppingCart },
    { to: '/deliveries', label: language === 'en' ? 'Deliveries' : 'Livraisons', icon: Truck },
    ...(user?.is_staff ? [
      { to: '/users', label: t('nav.users'), icon: Users },
      { to: '/activity-logs', label: t('nav.activityLogs'), icon: FileText },
      { to: '/admin-panel', label: t('nav.administration'), icon: Settings },
    ] : [])
  ]

  return (
    <div className="app-shell">
      <NotificationSystem />
      
      {/* Mobile Menu Toggle Button */}
      <button 
        className="mobile-menu-toggle" 
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="brand-card dashboard-card-enhanced">
          <div className="brand-content">
            <div className="brand-logo card-shimmer">
              <span className="brand-icon">K</span>
            </div>
            <div className="brand-text">
              <h1 className="brand-title">KAMGESTION</h1>
              <p className="brand-subtitle">{language === 'en' ? 'Sales Management' : 'Gestion des ventes'}</p>
            </div>
          </div>
          <p className="brand-description">
            {language === 'en' ? 'Catalog, stock, orders and deliveries.' : 'Catalogue, stock, commandes et livraisons.'}
          </p>
        </div>

        <nav className="nav-list" aria-label="Navigation principale">
          {navItems.map((item, index) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? 'nav-link nav-link-active' : 'nav-link'
                }
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={closeMobileMenu}
              >
                <Icon size={18} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-card dashboard-card-enhanced">
          <div className="user-profile-header">
            <div className="user-avatar">
              {userInitials}
            </div>
            <div className="user-info">
              <h2 className="user-name">
                {user?.username || t('common.user')}
                {user?.is_staff && (
                  <span className="staff-badge tooltip" data-tooltip={t('common.staffMember')}>
                    ⭐
                  </span>
                )}
              </h2>
              <p className="user-email">{user?.email || t('common.noEmail')}</p>
            </div>
          </div>

          <div className="sidebar-actions">
            <div className="language-switcher tooltip" data-tooltip={t('common.switchLanguage')}>
              <button
                className={language === 'fr' ? 'lang-button lang-button-active' : 'lang-button'}
                type="button"
                onClick={() => handleChangeLanguage('fr')}
                aria-label="Switch to French"
              >
                FR
              </button>
              <button
                className={language === 'en' ? 'lang-button lang-button-active' : 'lang-button'}
                type="button"
                onClick={() => handleChangeLanguage('en')}
                aria-label="Switch to English"
              >
                EN
              </button>
            </div>
            
            <button 
              className="button button-secondary theme-toggle tooltip" 
              type="button" 
              onClick={handleToggleTheme}
              data-tooltip={theme === 'dark' ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span className="theme-text">
                {theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
              </span>
            </button>

            <div className="action-buttons">
              <button 
                className="button button-secondary logout-button" 
                type="button" 
                onClick={handleLogout}
                data-tooltip={t('common.logoutTooltip')}
              >
                <LogOut size={16} />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          onClick={closeMobileMenu}
        />
      )}
    </div>
  )
}

export default MainLayout
