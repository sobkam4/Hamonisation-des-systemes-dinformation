'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { DataTable } from '@/components/data-table'
import { StockMovementDialog } from './stock-movement-dialog'
import { formatDate, formatCurrency } from '@/lib/format'
import type { Article, MouvementStock } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { articlesApi, mouvementsApi, ApiError } from '@/lib/api'

export default function StockPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [mouvements, setMouvements] = useState<MouvementStock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const loadStock = async () => {
      try {
        const [articlesResponse, mouvementsResponse] = await Promise.all([
          articlesApi.list(),
          mouvementsApi.list(),
        ])
        setArticles(articlesResponse.results)
        setMouvements(mouvementsResponse.results)
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Impossible de charger le stock.'
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadStock()
  }, [])

  const lowStockArticles = articles.filter((a) => a.is_low_stock)
  const totalStockValue = articles.reduce(
    (sum, a) => sum + parseFloat(a.prix_unitaire) * a.quantite_stock,
    0
  )

  const filteredMouvements = useMemo(() => {
    return mouvements.filter((mouvement) => {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        mouvement.article_detail?.nom.toLowerCase().includes(searchLower) ||
        mouvement.article_detail?.reference.toLowerCase().includes(searchLower) ||
        mouvement.reference?.toLowerCase().includes(searchLower)
      const matchesType =
        typeFilter === 'all' || mouvement.type_mouvement === typeFilter
      return matchesSearch && matchesType
    })
  }, [mouvements, search, typeFilter])

  const handleNewMovement = async (data: {
    article: number
    type_mouvement: string
    quantite: number
    notes?: string
  }) => {
    try {
      const newMovement = await mouvementsApi.create(data)
      const articlesResponse = await articlesApi.list()
      setArticles(articlesResponse.results)
      setMouvements((prev) => [
        {
          ...newMovement,
          article_detail:
            articlesResponse.results.find((article) => article.id === newMovement.article) ||
            newMovement.article_detail,
        },
        ...prev,
      ])
      toast.success('Mouvement de stock enregistre')
      setDialogOpen(false)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible d enregistrer le mouvement.'
      toast.error(message)
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entree':
        return <ArrowDownCircle className="h-4 w-4 text-success" />
      case 'sortie':
        return <ArrowUpCircle className="h-4 w-4 text-destructive" />
      default:
        return <Package className="h-4 w-4 text-warning" />
    }
  }

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'entree':
        return <Badge className="bg-success/20 text-success">Entree</Badge>
      case 'sortie':
        return <Badge className="bg-destructive/20 text-destructive">Sortie</Badge>
      default:
        return <Badge className="bg-warning/20 text-warning">Ajustement</Badge>
    }
  }

  const columns = [
    {
      key: 'article',
      header: 'Article',
      render: (mouvement: MouvementStock) => (
        <div className="flex items-center gap-3">
          {getMovementIcon(mouvement.type_mouvement)}
          <div>
            <p className="font-medium">{mouvement.article_detail?.nom}</p>
            <p className="text-sm text-muted-foreground">
              {mouvement.article_detail?.reference}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (mouvement: MouvementStock) => getMovementBadge(mouvement.type_mouvement),
    },
    {
      key: 'quantite',
      header: 'Quantite',
      render: (mouvement: MouvementStock) => (
        <span
          className={`font-semibold ${
            mouvement.type_mouvement === 'entree'
              ? 'text-success'
              : mouvement.type_mouvement === 'sortie'
                ? 'text-destructive'
                : 'text-warning'
          }`}
        >
          {mouvement.type_mouvement === 'sortie' || mouvement.quantite < 0 ? '-' : '+'}
          {Math.abs(mouvement.quantite)}
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (mouvement: MouvementStock) => (
        <span className="font-mono text-sm text-muted-foreground">
          {mouvement.reference || '-'}
        </span>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (mouvement: MouvementStock) => (
        <span className="text-muted-foreground max-w-[200px] truncate block">
          {mouvement.notes || '-'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (mouvement: MouvementStock) => formatDate(mouvement.created_at),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion du Stock"
        description="Suivi des mouvements de stock et alertes"
      >
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau mouvement
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valeur totale du stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-card-foreground">
              {formatCurrency(totalStockValue)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Articles en stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-card-foreground">
              {articles.length}
            </p>
          </CardContent>
        </Card>
        <Card className={`bg-card border-border ${lowStockArticles.length > 0 ? 'border-warning/50' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertes stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">
              {lowStockArticles.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {lowStockArticles.length > 0 && (
        <Card className="bg-warning/5 border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Articles en rupture de stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockArticles.map((article) => (
                <Badge
                  key={article.id}
                  variant="outline"
                  className="border-warning/50 text-warning"
                >
                  {article.nom} ({article.quantite_stock}/{article.seuil_alerte})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par article ou reference..."
          className="sm:w-80"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full bg-input border-border sm:w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="entree">Entrees</SelectItem>
            <SelectItem value="sortie">Sorties</SelectItem>
            <SelectItem value="ajustement">Ajustements</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredMouvements}
        keyExtractor={(mouvement) => mouvement.id}
        isLoading={isLoading}
        emptyMessage="Aucun mouvement de stock"
      />

      <StockMovementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        articles={articles}
        onSave={handleNewMovement}
      />
    </div>
  )
}
