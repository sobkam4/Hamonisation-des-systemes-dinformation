'use client'

import { useState, useEffect, useMemo } from 'react'
import { Truck, MapPin, Calendar, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { DataTable } from '@/components/data-table'
import {
  formatDate,
  formatDeliveryStatus,
  getDeliveryStatusColor,
} from '@/lib/format'
import type { Livraison, DeliveryStatus } from '@/lib/types'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { commandesApi, livraisonsApi, ApiError } from '@/lib/api'

const statusOptions: { value: DeliveryStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'livree', label: 'Livree' },
  { value: 'echouee', label: 'Echouee' },
]

export default function DeliveriesPage() {
  const [livraisons, setLivraisons] = useState<Livraison[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        const ordersResponse = await commandesApi.list()
        const ordersById = new Map(ordersResponse.results.map((order) => [order.id, order]))
        const deliveriesResponse = await livraisonsApi.list({ ordersById })
        setLivraisons(deliveriesResponse.results)
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Impossible de charger les livraisons.'
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadDeliveries()
  }, [])

  const filteredLivraisons = useMemo(() => {
    return livraisons.filter((livraison) => {
      const searchLower = search.toLowerCase()
      const numero =
        livraison.commande_detail?.numero ?? livraison.numero_commande ?? ''
      const clientNom = livraison.commande_detail?.client_detail?.nom ?? ''
      const adresse = livraison.adresse_livraison ?? ''
      const matchesSearch =
        numero.toLowerCase().includes(searchLower) ||
        clientNom.toLowerCase().includes(searchLower) ||
        adresse.toLowerCase().includes(searchLower)
      const matchesStatus =
        statusFilter === 'all' || livraison.statut === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [livraisons, search, statusFilter])

  const updateStatus = async (id: number, newStatus: DeliveryStatus) => {
    try {
      const updated = await livraisonsApi.updateStatus(id, newStatus)
      setLivraisons((prev) =>
        prev.map((l) =>
          l.id === id ? { ...updated, commande_detail: l.commande_detail } : l
        )
      )
      toast.success(`Statut mis a jour: ${formatDeliveryStatus(newStatus)}`)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible de mettre a jour la livraison.'
      toast.error(message)
    }
  }

  const columns = [
    {
      key: 'commande',
      header: 'Commande',
      render: (livraison: Livraison) => (
        <div className="space-y-1">
          <span className="font-mono font-medium">
            {livraison.commande_detail?.numero ?? livraison.numero_commande ?? '—'}
          </span>
          <p className="text-sm text-muted-foreground">
            {livraison.commande_detail?.client_detail?.nom || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'adresse',
      header: 'Adresse',
      render: (livraison: Livraison) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="max-w-[200px] truncate">{livraison.adresse_livraison}</span>
        </div>
      ),
    },
    {
      key: 'date_prevue',
      header: 'Date prevue',
      render: (livraison: Livraison) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {formatDate(livraison.date_livraison_prevue)}
        </div>
      ),
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (livraison: Livraison) => (
        <Badge className={getDeliveryStatusColor(livraison.statut)}>
          {formatDeliveryStatus(livraison.statut)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[80px]',
      render: (livraison: Livraison) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {livraison.statut === 'en_attente' && (
              <DropdownMenuItem onClick={() => updateStatus(livraison.id, 'en_cours')}>
                Demarrer la livraison
              </DropdownMenuItem>
            )}
            {livraison.statut === 'en_cours' && (
              <>
                <DropdownMenuItem onClick={() => updateStatus(livraison.id, 'livree')}>
                  Marquer livree
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => updateStatus(livraison.id, 'echouee')}
                  className="text-destructive focus:text-destructive"
                >
                  Marquer echouee
                </DropdownMenuItem>
              </>
            )}
            {livraison.statut === 'echouee' && (
              <DropdownMenuItem onClick={() => updateStatus(livraison.id, 'en_cours')}>
                Retenter la livraison
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Livraisons"
        description="Suivi et gestion des livraisons"
      >
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {livraisons.filter((l) => l.statut === 'en_cours').length} en cours
          </span>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par commande, client ou adresse..."
          className="sm:w-96"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full bg-input border-border sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredLivraisons}
        keyExtractor={(livraison) => livraison.id}
        isLoading={isLoading}
        emptyMessage="Aucune livraison trouvee"
      />
    </div>
  )
}
