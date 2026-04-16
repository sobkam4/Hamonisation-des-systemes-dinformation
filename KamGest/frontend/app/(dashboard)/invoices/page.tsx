'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Download,
  CheckCircle,
  Clock,
  MoreHorizontal,
  FileSpreadsheet,
  FileArchive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { DataTable } from '@/components/data-table'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Facture } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { facturesApi, ApiError } from '@/lib/api'

export default function InvoicesPage() {
  const [factures, setFactures] = useState<Facture[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [documentFilter, setDocumentFilter] = useState<string>('all')

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const response = await facturesApi.list()
        setFactures(response.results)
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Impossible de charger les factures.'
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadInvoices()
  }, [])

  const filteredFactures = useMemo(() => {
    return factures.filter((facture) => {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        facture.numero.toLowerCase().includes(searchLower) ||
        facture.commande_detail?.client_detail?.nom?.toLowerCase().includes(searchLower)
      const matchesDocument =
        documentFilter === 'all' ||
        (documentFilter === 'generated' && !!facture.pdf_url) ||
        (documentFilter === 'ready' && !facture.pdf_url)
      return matchesSearch && matchesDocument
    })
  }, [factures, search, documentFilter])

  const saveBlobAsFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.setTimeout(() => window.URL.revokeObjectURL(url), 500)
  }

  const downloadInvoice = async (facture: Facture) => {
    try {
      const blob = await facturesApi.downloadPdf(facture.commande)
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible de telecharger la facture.'
      toast.error(message)
    }
  }

  const exportInvoicesExcel = async () => {
    try {
      const blob = await facturesApi.exportExcel()
      saveBlobAsFile(blob, 'factures.xlsx')
      toast.success('Export Excel telecharge')
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible d exporter en Excel.'
      toast.error(message)
    }
  }

  const exportInvoicesPdfZip = async () => {
    try {
      const blob = await facturesApi.exportPdfZip()
      saveBlobAsFile(blob, 'factures.zip')
      toast.success('Archive PDF telechargee')
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible d exporter les PDF.'
      toast.error(message)
    }
  }

  const totalAmount = factures
    .reduce((sum, f) => sum + parseFloat(f.montant_total), 0)

  const columns = [
    {
      key: 'numero',
      header: 'Numero',
      render: (facture: Facture) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono font-medium">{facture.numero}</span>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (facture: Facture) => (
        <div className="space-y-1">
          <span className="font-medium">
            {facture.commande_detail?.client_detail?.nom}
          </span>
          <p className="text-sm text-muted-foreground">
            {facture.commande_detail?.numero}
          </p>
        </div>
      ),
    },
    {
      key: 'date_emission',
      header: 'Date emission',
      render: (facture: Facture) => formatDate(facture.date_emission),
    },
    {
      key: 'date_echeance',
      header: 'Echeance',
      render: (facture: Facture) => formatDate(facture.date_echeance),
    },
    {
      key: 'montant',
      header: 'Montant',
      render: (facture: Facture) => (
        <span className="font-medium">{formatCurrency(facture.montant_total)}</span>
      ),
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (facture: Facture) => (
        <Badge
          className={
            facture.pdf_url
              ? 'bg-success/20 text-success'
              : 'bg-warning/20 text-warning'
          }
        >
          {facture.pdf_url ? (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Generee
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              A telecharger
            </span>
          )}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[80px]',
      render: (facture: Facture) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => downloadInvoice(facture)}>
              <Download className="mr-2 h-4 w-4" />
              Telecharger PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Factures" description="Gestion de la facturation">
        <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => void exportInvoicesExcel()}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => void exportInvoicesPdfZip()}>
              <FileArchive className="mr-2 h-4 w-4" />
              PDF (ZIP)
            </Button>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total facture</p>
            <p className="text-lg font-bold text-card-foreground">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par numero ou client..."
          className="sm:w-80"
        />
        <Select value={documentFilter} onValueChange={setDocumentFilter}>
          <SelectTrigger className="w-full bg-input border-border sm:w-48">
            <SelectValue placeholder="Document" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="generated">Generees</SelectItem>
            <SelectItem value="ready">A telecharger</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredFactures}
        keyExtractor={(facture) => facture.id}
        isLoading={isLoading}
        emptyMessage="Aucune facture trouvee"
      />
    </div>
  )
}
