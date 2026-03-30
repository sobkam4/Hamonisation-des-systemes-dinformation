import React from 'react'

function LoadingSpinner({ size = 'medium', text = '' }) {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  }

  return (
    <div className="loading-container">
      <div className={`spinner ${sizeClasses[size] || sizeClasses.medium}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  )
}

export default LoadingSpinner
