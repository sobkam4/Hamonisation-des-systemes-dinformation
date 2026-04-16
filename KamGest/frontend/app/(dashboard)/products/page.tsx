'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Package, AlertTriangle, Edit, Trash2, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { DataTable } from '@/components/data-table'
import { ProductDialog } from './product-dialog'
import { CategoryDialog } from './category-dialog'
import { formatCurrency } from '@/lib/format'
import type { Article, Category } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { articlesApi, categoriesApi, ApiError } from '@/lib/api'

export default function ProductsPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showLowStock, setShowLowStock] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [deleteArticle, setDeleteArticle] = useState<Article | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [articlesResponse, categoriesResponse] = await Promise.all([
          articlesApi.list(),
          categoriesApi.list(),
        ])
        setArticles(articlesResponse.results)
        setCategories(categoriesResponse.results)
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Impossible de charger les produits.'
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [])

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesSearch =
        article.nom.toLowerCase().includes(search.toLowerCase()) ||
        article.reference.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        selectedCategory === 'all' || article.categorie?.toString() === selectedCategory
      const matchesLowStock = !showLowStock || article.is_low_stock
      return matchesSearch && matchesCategory && matchesLowStock
    })
  }, [articles, search, selectedCategory, showLowStock])

  const handleSave = async (data: Partial<Article>) => {
    try {
      if (editingArticle) {
        const updatedArticle = await articlesApi.update(editingArticle.id, {
          reference: data.reference,
          nom: data.nom,
          description: data.description,
          prix_unitaire: data.prix_unitaire,
          quantite_stock: data.quantite_stock,
          seuil_alerte: data.seuil_alerte,
          categorie: data.categorie ?? undefined,
        })
        setArticles((prev) => prev.map((a) => (a.id === editingArticle.id ? updatedArticle : a)))
        toast.success('Produit mis a jour avec succes')
      } else {
        const createdArticle = await articlesApi.create({
          ...(data.reference?.trim() ? { reference: data.reference.trim() } : {}),
          nom: data.nom || '',
          description: data.description,
          prix_unitaire: data.prix_unitaire || '0',
          quantite_stock: data.quantite_stock || 0,
          seuil_alerte: data.seuil_alerte || 10,
          categorie: data.categorie ?? undefined,
        })
        setArticles((prev) => [createdArticle, ...prev])
        toast.success('Produit ajoute avec succes')
      }

      setDialogOpen(false)
      setEditingArticle(null)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible d enregistrer le produit.'
      toast.error(message)
    }
  }

  const handleCategorySave = async (data: { nom: string; description?: string }) => {
    try {
      const created = await categoriesApi.create({
        nom: data.nom,
        description: data.description,
      })
      setCategories((prev) => [...prev, created].sort((a, b) => a.nom.localeCompare(b.nom)))
      toast.success('Categorie creee avec succes')
      setCategoryDialogOpen(false)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible de creer la categorie.'
      toast.error(message)
      throw error
    }
  }

  const handleDelete = async () => {
    if (!deleteArticle) return

    try {
      await articlesApi.delete(deleteArticle.id)
      setArticles((prev) => prev.filter((a) => a.id !== deleteArticle.id))
      toast.success('Produit supprime avec succes')
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible de supprimer le produit.'
      toast.error(message)
    } finally {
      setDeleteArticle(null)
    }
  }

  const columns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (article: Article) => (
        <span className="font-mono text-sm">{article.reference}</span>
      ),
    },
    {
      key: 'nom',
      header: 'Nom',
      render: (article: Article) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{article.nom}</span>
        </div>
      ),
    },
    {
      key: 'categorie',
      header: 'Categorie',
      render: (article: Article) => (
        <Badge variant="secondary">
          {article.categorie_detail?.nom || 'Non classe'}
        </Badge>
      ),
    },
    {
      key: 'prix_unitaire',
      header: 'Prix unitaire',
      render: (article: Article) => formatCurrency(article.prix_unitaire),
    },
    {
      key: 'quantite_stock',
      header: 'Stock',
      render: (article: Article) => (
        <div className="flex items-center gap-2">
          <span
            className={article.is_low_stock ? 'font-bold text-warning' : ''}
          >
            {article.quantite_stock}
          </span>
          {article.is_low_stock && (
            <AlertTriangle className="h-4 w-4 text-warning" />
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[100px]',
      render: (article: Article) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setEditingArticle(article)
              setDialogOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Modifier</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteArticle(article)
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Supprimer</span>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Produits" description="Gestion du catalogue de produits">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Nouvelle categorie
          </Button>
          <Button
            onClick={() => {
              setEditingArticle(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par nom ou reference..."
          className="sm:w-80"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full bg-input border-border sm:w-48">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showLowStock ? 'default' : 'outline'}
          onClick={() => setShowLowStock(!showLowStock)}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Stock faible
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredArticles}
        keyExtractor={(article) => article.id}
        isLoading={isLoading}
        emptyMessage="Aucun produit trouve"
      />

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        article={editingArticle}
        categories={categories}
        onSave={handleSave}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSave={handleCategorySave}
      />

      <AlertDialog open={!!deleteArticle} onOpenChange={() => setDeleteArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer le produit &quot;{deleteArticle?.nom}&quot; ?
              Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
