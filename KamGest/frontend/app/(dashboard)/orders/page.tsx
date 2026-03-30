'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Eye, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { DataTable } from '@/components/data-table'
import {
  formatCurrency,
  formatDate,
  formatOrderStatus,
  getOrderStatusColor,
} from '@/lib/format'
import type { Commande, OrderStatus } from '@/lib/types'
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
import { commandesApi, ApiError } from '@/lib/api'

const statusOptions: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'confirmee', label: 'Confirmee' },
  { value: 'livree', label: 'Livree' },
  { value: 'annulee', label: 'Annulee' },
]

export default function OrdersPage() {
  const router = useRouter()
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await commandesApi.list()
        setCommandes(response.results)
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Impossible de charger les commandes.'
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadOrders()
  }, [])

  const filteredCommandes = useMemo(() => {
    return commandes.filter((commande) => {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        commande.numero.toLowerCase().includes(searchLower) ||
        commande.client_detail?.nom.toLowerCase().includes(searchLower)
      const matchesStatus =
        statusFilter === 'all' || commande.statut === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [commandes, search, statusFilter])

  const updateStatus = async (id: number, newStatus: OrderStatus) => {
    try {
      const updated = await commandesApi.updateStatus(id, newStatus)
      setCommandes((prev) => prev.map((c) => (c.id === id ? updated : c)))
      toast.success(`Statut mis a jour: ${formatOrderStatus(newStatus)}`)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible de mettre a jour la commande.'
      toast.error(message)
    }
  }

  const columns = [
    {
      key: 'numero',
      header: 'Numero',
      render: (commande: Commande) => (
        <span className="font-mono font-medium">{commande.numero}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (commande: Commande) => (
        <span className="font-medium">{commande.client_detail?.nom || '-'}</span>
      ),
    },
    {
      key: 'date_commande',
      header: 'Date',
      render: (commande: Commande) => formatDate(commande.date_commande),
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (commande: Commande) => (
        <Badge className={getOrderStatusColor(commande.statut)}>
          {formatOrderStatus(commande.statut)}
        </Badge>
      ),
    },
    {
      key: 'montant_total',
      header: 'Montant',
      render: (commande: Commande) => (
        <span className="font-medium">{formatCurrency(commande.montant_total)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[100px]',
      render: (commande: Commande) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/orders/${commande.id}`)
            }}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Voir</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/orders/${commande.id}`)}>
                Voir details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {commande.statut === 'brouillon' && (
                <DropdownMenuItem onClick={() => updateStatus(commande.id, 'confirmee')}>
                  Confirmer
                </DropdownMenuItem>
              )}
              {commande.statut === 'confirmee' && (
                <DropdownMenuItem onClick={() => updateStatus(commande.id, 'livree')}>
                  Marquer livree
                </DropdownMenuItem>
              )}
              {commande.statut !== 'annulee' && commande.statut !== 'livree' && (
                <DropdownMenuItem
                  onClick={() => updateStatus(commande.id, 'annulee')}
                  className="text-destructive focus:text-destructive"
                >
                  Annuler
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Commandes" description="Gestion des commandes clients">
        <Button onClick={() => router.push('/orders/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle commande
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par numero ou client..."
          className="sm:w-80"
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
        data={filteredCommandes}
        keyExtractor={(commande) => commande.id}
        onRowClick={(commande) => router.push(`/orders/${commande.id}`)}
        isLoading={isLoading}
        emptyMessage="Aucune commande trouvee"
      />
    </div>
  )
}
