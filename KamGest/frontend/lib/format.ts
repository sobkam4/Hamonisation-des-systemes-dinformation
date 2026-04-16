// Formatting utilities for KamGestion

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('fr-GN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num) + ' GNF'
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    brouillon: 'Brouillon',
    confirmee: 'Confirmee',
    livree: 'Livree',
    annulee: 'Annulee',
  }
  return statusMap[status] || status
}

export function formatDeliveryStatus(status: string): string {
  const statusMap: Record<string, string> = {
    en_attente: 'En attente',
    en_cours: 'En cours',
    livree: 'Livree',
    echouee: 'Echouee',
  }
  return statusMap[status] || status
}

export function getOrderStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    brouillon: 'bg-muted text-muted-foreground',
    confirmee: 'bg-chart-2/20 text-chart-2',
    livree: 'bg-success/20 text-success',
    annulee: 'bg-destructive/20 text-destructive',
  }
  return colorMap[status] || 'bg-muted text-muted-foreground'
}

export function getDeliveryStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    en_attente: 'bg-muted text-muted-foreground',
    en_cours: 'bg-warning/20 text-warning',
    livree: 'bg-success/20 text-success',
    echouee: 'bg-destructive/20 text-destructive',
  }
  return colorMap[status] || 'bg-muted text-muted-foreground'
}
