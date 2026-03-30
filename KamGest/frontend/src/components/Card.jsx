import React from 'react'

function Card({ children, className = '', hover = false, padding = 'normal', onClick }) {
  const cardClasses = [
    'card',
    className,
    hover ? 'card-hover' : '',
    `card-padding-${padding}`
  ].filter(Boolean).join(' ')

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(e)
        }
      } : undefined}
    >
      {children}
    </div>
  )
}

export default Card
