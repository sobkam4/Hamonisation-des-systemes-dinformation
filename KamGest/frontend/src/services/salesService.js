import { apiBlobResponse, apiRequest, downloadBlob } from './apiClient.js'

const PRODUCTS_ROOT = '/api/products/'
const CUSTOMERS_ROOT = '/api/customers/'
const CATEGORIES_ROOT = '/api/categories/'
const ORDERS_ROOT = '/api/orders/'
const DELIVERIES_ROOT = '/api/deliveries/'

export function getDashboardStats() {
  return apiRequest('/api/dashboard/stats/')
}

export function listCategories() {
  return apiRequest(CATEGORIES_ROOT)
}

export function createCategory(payload) {
  return apiRequest(CATEGORIES_ROOT, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listProducts() {
  return apiRequest(PRODUCTS_ROOT)
}

export function createProduct(payload) {
  return apiRequest(PRODUCTS_ROOT, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProduct(productId, payload) {
  return apiRequest(`${PRODUCTS_ROOT}${productId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteProduct(productId) {
  return apiRequest(`${PRODUCTS_ROOT}${productId}/`, {
    method: 'DELETE',
  })
}

export function exportProductsExcel() {
  return downloadBlob('/api/exports/products/', 'articles.xlsx')
}

export function importProductsSpreadsheet(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequest('/api/imports/products/', {
    method: 'POST',
    body: formData,
  })
}

export function downloadProductTemplateExcel() {
  return downloadBlob('/api/templates/products/excel/', 'modele_articles.xlsx')
}

export function downloadProductTemplateCsv() {
  return downloadBlob('/api/templates/products/csv/', 'modele_articles.csv')
}

export function listCustomers() {
  return apiRequest(CUSTOMERS_ROOT)
}

export function createCustomer(payload) {
  return apiRequest(CUSTOMERS_ROOT, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCustomer(customerId, payload) {
  return apiRequest(`${CUSTOMERS_ROOT}${customerId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteCustomer(customerId) {
  return apiRequest(`${CUSTOMERS_ROOT}${customerId}/`, {
    method: 'DELETE',
  })
}

export function exportCustomersExcel() {
  return downloadBlob('/api/exports/customers/', 'clients.xlsx')
}

export function importCustomersSpreadsheet(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequest('/api/imports/customers/', {
    method: 'POST',
    body: formData,
  })
}

export function downloadCustomerTemplateExcel() {
  return downloadBlob('/api/templates/customers/excel/', 'modele_clients.xlsx')
}

export function downloadCustomerTemplateCsv() {
  return downloadBlob('/api/templates/customers/csv/', 'modele_clients.csv')
}

export function listOrders() {
  return apiRequest(ORDERS_ROOT)
}

export function getOrder(orderId) {
  return apiRequest(`${ORDERS_ROOT}${orderId}/`)
}

export function createOrder(payload) {
  return apiRequest(ORDERS_ROOT, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateOrder(orderId, payload) {
  return apiRequest(`${ORDERS_ROOT}${orderId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteOrder(orderId) {
  return apiRequest(`${ORDERS_ROOT}${orderId}/`, {
    method: 'DELETE',
  })
}

export function exportOrdersExcel() {
  return downloadBlob('/api/exports/orders/', 'commandes.xlsx')
}

export async function downloadOrderInvoice(orderId) {
  const { blob, response } = await apiBlobResponse(`/api/orders/${orderId}/invoice/`)
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  const disposition = response.headers.get('Content-Disposition') || ''
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/)
  const filename = filenameMatch?.[1] || `facture_commande_${orderId}.pdf`

  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}

export function listDeliveries() {
  return apiRequest(DELIVERIES_ROOT)
}

export function createDelivery(payload) {
  return apiRequest(DELIVERIES_ROOT, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateDelivery(deliveryId, payload) {
  return apiRequest(`${DELIVERIES_ROOT}${deliveryId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
