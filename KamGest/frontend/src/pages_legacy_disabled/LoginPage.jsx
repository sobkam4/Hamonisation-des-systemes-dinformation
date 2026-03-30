import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Moon, Sun, LogIn, User, Lock, Eye, EyeOff } from 'lucide-react'

import PageHeader from '../components/PageHeader.jsx'
import PlaceholderNotice from '../components/PlaceholderNotice.jsx'
import Loader from '../components/Loader.jsx'
import { useAuth } from '../context/useAuth.js'
import { useLanguage } from '../context/useLanguage.js'
import { getStoredTheme, setStoredTheme } from '../services/themeService.js'

function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => getStoredTheme())
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setStoredTheme(theme)
  }, [theme])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await login(formData)
      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleToggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  function handleChangeLanguage(nextLanguage) {
    setLanguage(nextLanguage)
  }

  return (
    <div className="standalone-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="login-container" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: '2rem',
        animation: 'fadeIn 0.6s ease-out'
      }}>
        <div className="content-stack content-narrow">
          <div className="login-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="brand-logo" style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1rem',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary), #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              boxShadow: 'var(--shadow-lg)'
            }}>
              K
            </div>
            <h1 style={{ 
              fontSize: '1.8rem', 
              fontWeight: '700', 
              marginBottom: '0.5rem',
              color: 'var(--text)'
            }}>
              KamGestion
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
              Plateforme de gestion des ventes
            </p>
          </div>

          <div className="panel" style={{
            padding: '2rem',
            background: 'var(--panel)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: 'var(--text)' }}>
                Connexion
              </h2>
              <button 
                className="button button-secondary" 
                type="button" 
                onClick={handleToggleTheme}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            {error ? (
              <div className="alert alert-danger" style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 109, 122, 0.12)',
                border: '1px solid rgba(255, 109, 122, 0.3)',
                color: 'var(--danger)',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: '500' }}>
                    Nom d'utilisateur
                  </span>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--muted)',
                      zIndex: 1
                    }} />
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="admin"
                      autoComplete="username"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-soft)',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </div>
                </label>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: '500' }}>
                    Mot de passe
                  </span>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--muted)',
                      zIndex: 1
                    }} />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="********"
                      autoComplete="current-password"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-soft)',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        padding: '0.25rem'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="form-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  className="button" 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isSubmitting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Loader size="small" text="" />
                      Connexion...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LogIn size={18} />
                      Se connecter
                    </div>
                  )}
                </button>
                
                <a 
                  className="button button-secondary" 
                  href="/admin/"
                  style={{
                    textAlign: 'center',
                    padding: '0.75rem',
                    textDecoration: 'none'
                  }}
                >
                  Aller vers Django admin
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
