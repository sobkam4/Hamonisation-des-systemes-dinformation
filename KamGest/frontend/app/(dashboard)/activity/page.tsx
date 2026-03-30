'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  History,
  User,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Truck,
  Download,
  ShieldAlert,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { DataTable } from '@/components/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/format'
import type { JournalActivite } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { journalApi, ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

const ENTITY_LABELS: Record<string, string> = {
  product: 'Article',
  customer: 'Client',
  order: 'Commande',
  delivery: 'Livraison',
  auth: 'Authentification',
  user: 'Utilisateur',
  ticket: 'Ticket',
  stock_movement: 'Stock',
}

const entityOptions = [
  { value: 'all', label: 'Toutes les entites' },
  { value: 'product', label: 'Articles' },
  { value: 'customer', label: 'Clients' },
  { value: 'order', label: 'Commandes' },
  { value: 'delivery', label: 'Livraisons' },
  { value: 'auth', label: 'Authentification' },
  { value: 'user', label: 'Utilisateurs' },
  { value: 'ticket', label: 'Tickets' },
  { value: 'stock_movement', label: 'Stock' },
]

function getActionBadge(action: string) {
  if (action.includes('created') || action.includes('cree')) {
    return <Badge className="bg-success/20 text-success">Creation</Badge>
  }
  if (action.includes('updated') || action.includes('modifie')) {
    return <Badge className="bg-chart-2/20 text-chart-2">Modification</Badge>
  }
  if (action.includes('deleted') || action.includes('supprime')) {
    return <Badge className="bg-destructive/20 text-destructive">Suppression</Badge>
  }
  if (action.includes('login')) {
    return <Badge variant="outline">Connexion</Badge>
  }
  if (action.includes('invoice') || action.includes('facture')) {
    return <Badge className="bg-muted text-muted-foreground">Facture</Badge>
  }
  if (action.includes('stock') || action.includes('adjust')) {
    return <Badge className="bg-warning/20 text-warning">Stock</Badge>
  }
  return <Badge variant="secondary">{action}</Badge>
}

export default function ActivityPage() {
  const { user } = useAuth()
  const isStaff = user?.is_staff === true

  const [activites, setActivites] = useState<JournalActivite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (!isStaff) {
      setActivites([])
      setIsLoading(false)
      return
    }

    const load = async () => {
      setIsLoading(true)
      try {
        const response = await journalApi.list()
        setActivites(response.results)
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Impossible de charger le journal.'
        toast.error(message)
        setActivites([])
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [isStaff])

  const filteredActivites = useMemo(() => {
    return activites.filter((activite) => {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !searchLower ||
        activite.utilisateur_detail?.username.toLowerCase().includes(searchLower) ||
        activite.action.toLowerCase().includes(searchLower) ||
        activite.entite.toLowerCase().includes(searchLower) ||
        activite.description.toLowerCase().includes(searchLower)
      const matchesEntity = entityFilter === 'all' || activite.entite === entityFilter
      return matchesSearch && matchesEntity
    })
  }, [activites, search, entityFilter])

  const downloadLogs = async () => {
    setIsExporting(true)
    try {
      const blob = await journalApi.exportPdf()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'journal-activites.pdf'
      a.click()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 500)
      toast.success('Export PDF telecharge')
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible de telecharger les logs.'
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }

  const getEntityIcon = (entite: string) => {
    switch (entite) {
      case 'product':
        return <Package className="h-4 w-4" />
      case 'customer':
        return <Users className="h-4 w-4" />
      case 'order':
        return <ShoppingCart className="h-4 w-4" />
      case 'ticket':
        return <FileText className="h-4 w-4" />
      case 'delivery':
        return <Truck className="h-4 w-4" />
      default:
        return <History className="h-4 w-4" />
    }
  }

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (activite: JournalActivite) => (
        <span className="text-muted-foreground">{formatDateTime(activite.created_at)}</span>
      ),
    },
    {
      key: 'utilisateur',
      header: 'Utilisateur',
      render: (activite: JournalActivite) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-medium">
            {activite.utilisateur_detail?.username || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (activite: JournalActivite) => getActionBadge(activite.action),
    },
    {
      key: 'entite',
      header: 'Entite',
      render: (activite: JournalActivite) => (
        <div className="flex items-center gap-2">
          {getEntityIcon(activite.entite)}
          <span>{ENTITY_LABELS[activite.entite] || activite.entite}</span>
          {activite.entite_id ? (
            <span className="text-muted-foreground">#{activite.entite_id}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (activite: JournalActivite) => (
        <span className="block max-w-md truncate text-sm text-muted-foreground">
          {activite.description}
        </span>
      ),
    },
  ]

  if (!isStaff) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Journal d'activites"
          description="Historique des actions effectuees dans le systeme"
        />
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Acces restreint</CardTitle>
            </div>
            <CardDescription>
              Seuls les comptes administrateur peuvent consulter et exporter le journal
              d&apos;activites.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connectez-vous avec un utilisateur staff ou demandez a un administrateur l&apos;export
              des logs.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal d'activites"
        description="Historique des actions effectuees dans le systeme"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={() => void downloadLogs()}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Export...' : 'Telecharger PDF'}
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <History className="h-5 w-5" />
            <span className="text-sm">{activites.length} activites</span>
          </div>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher (utilisateur, action, description...)"
          className="sm:flex-1 sm:max-w-md"
        />
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-full bg-input border-border sm:w-52">
            <SelectValue placeholder="Entite" />
          </SelectTrigger>
          <SelectContent>
            {entityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredActivites}
        keyExtractor={(activite) => activite.id}
        isLoading={isLoading}
        emptyMessage="Aucune activite enregistree"
      />
    </div>
  )
}
