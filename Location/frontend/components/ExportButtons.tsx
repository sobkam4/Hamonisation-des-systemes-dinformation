'use client'

import React, { useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface ExportButtonsProps {
  type: 'monthly' | 'annual'
  year?: number
  month?: number
  className?: string
}

export default function ExportButtons({ type, year, month, className = '' }: ExportButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const exportYear = year || currentYear
  const exportMonth = month || currentMonth

  const handleExport = async (format: 'excel' | 'pdf', reportType: 'monthly' | 'annual') => {
    setLoading(`${reportType}-${format}`)
    
    try {
      let url = ''
      
      if (reportType === 'monthly') {
        url = `/api/analytics/export/rapport-mensuel/${format}/?annee=${exportYear}&mois=${exportMonth}`
      } else {
        url = `/api/analytics/export/rapport-annuel/excel/?annee=${exportYear}`
      }

      const response = await apiClient.getBlob(url)

      // Créer un nom de fichier
      const fileName = reportType === 'monthly' 
        ? `rapport_mensuel_${exportYear}_${exportMonth.toString().padStart(2, '0')}.${format === 'excel' ? 'xlsx' : 'pdf'}`
        : `rapport_annuel_${exportYear}.xlsx`

      // Créer un lien de téléchargement
      const blob = new Blob([response], {
        type: format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      })
      
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      // Vous pourriez vouloir afficher une notification d'erreur ici
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {type === 'monthly' && (
        <>
          <button
            onClick={() => handleExport('excel', 'monthly')}
            disabled={loading === 'monthly-excel'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === 'monthly-excel' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Exporter Excel
          </button>
          
          <button
            onClick={() => handleExport('pdf', 'monthly')}
            disabled={loading === 'monthly-pdf'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === 'monthly-pdf' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Exporter PDF
          </button>
        </>
      )}
      
      {type === 'annual' && (
        <button
          onClick={() => handleExport('excel', 'annual')}
          disabled={loading === 'annual-excel'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading === 'annual-excel' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          Exporter Annuel Excel
        </button>
      )}
    </div>
  )
}

// Composant pour les rapports mensuels
export function MonthlyExportButtons({ year, month, className }: Omit<ExportButtonsProps, 'type'>) {
  return <ExportButtons type="monthly" year={year} month={month} className={className} />
}

// Composant pour les rapports annuels
export function AnnualExportButtons({ year, className }: Omit<ExportButtonsProps, 'type' | 'month'>) {
  return <ExportButtons type="annual" year={year} className={className} />
}
