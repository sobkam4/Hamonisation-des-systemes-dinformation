import React, { useState, useEffect } from 'react'
import Alert from './Alert.jsx'

// Global notification state
let globalNotifications = []
let globalSetNotifications = null

function NotificationSystem() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    globalSetNotifications = setNotifications
    globalNotifications = notifications
  }, [notifications])

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Expose addNotification globally
  useEffect(() => {
    window.addNotification = (notification) => {
      const id = Date.now()
      const newNotification = { ...notification, id }
      
      setNotifications(prev => [...prev, newNotification])
      
      setTimeout(() => {
        removeNotification(id)
      }, 5000)
      
      return id
    }

    return () => {
      delete window.addNotification
    }
  }, [])

  return (
    <div className="notification-system">
      {notifications.map(notification => (
        <Alert
          key={notification.id}
          type={notification.type}
          title={notification.title}
          dismissible
          onDismiss={() => removeNotification(notification.id)}
        >
          {notification.message}
        </Alert>
      ))}
    </div>
  )
}

export default NotificationSystem
