import { apiRequest, downloadBlob } from './apiClient.js'

export function listActivityLogs() {
  return apiRequest('/api/activity-logs/')
}

export function exportActivityLogsPdf() {
  return downloadBlob('/api/exports/activity-logs/', 'journal-activites.pdf')
}
