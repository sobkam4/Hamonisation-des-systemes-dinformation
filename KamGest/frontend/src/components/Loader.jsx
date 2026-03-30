import { Loader2 } from 'lucide-react'

function Loader({ size = 'medium', text = 'Chargement...' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  return (
    <div className="loader-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '2rem'
    }}>
      <Loader2 
        size={size === 'small' ? 16 : size === 'medium' ? 24 : 32}
        className={`loader-spin ${sizeClasses[size]}`}
        style={{
          animation: 'spin 1s linear infinite',
          color: 'var(--primary)'
        }}
      />
      {text && (
        <span 
          className="loader-text"
          style={{
            color: 'var(--muted)',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          {text}
        </span>
      )}
    </div>
  )
}

export default Loader
