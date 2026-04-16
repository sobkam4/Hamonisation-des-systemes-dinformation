import React from 'react'

function Alert({ type = 'info', title, children, dismissible = false, onDismiss }) {
  const alertClasses = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    danger: 'alert-danger'
  }

  return (
    <div className={`alert ${alertClasses[type] || alertClasses.info} fade-in`}>
      <div className="alert-content">
        {title && <h4 className="alert-title">{title}</h4>}
        <div className="alert-message">{children}</div>
      </div>
      {dismissible && (
        <button 
          className="alert-close" 
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  )
}

export default Alert
