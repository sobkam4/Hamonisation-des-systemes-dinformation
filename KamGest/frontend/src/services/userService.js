import { apiRequest, downloadBlob } from './apiClient.js'

const API_ROOT = '/api/users/'

export function listUsers() {
  return apiRequest(API_ROOT)
}

export function createUser(payload) {
  return apiRequest(API_ROOT, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUser(userId, payload) {
  return apiRequest(`${API_ROOT}${userId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteUser(userId) {
  return apiRequest(`${API_ROOT}${userId}/`, {
    method: 'DELETE',
  })
}

export function exportUsersExcel() {
  return downloadBlob('/api/exports/users/', 'utilisateurs.xlsx')
}

export function importUsersSpreadsheet(file) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest('/api/imports/users/', {
    method: 'POST',
    body: formData,
  })
}

export function downloadUserTemplateExcel() {
  return downloadBlob('/api/templates/users/excel/', 'modele_utilisateurs.xlsx')
}

export function downloadUserTemplateCsv() {
  return downloadBlob('/api/templates/users/csv/', 'modele_utilisateurs.csv')
}
