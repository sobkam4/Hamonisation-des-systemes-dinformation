'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { formatCurrency } from '@/lib/format'
import type { Client, Article } from '@/lib/types'
import { toast } from 'sonner'
import { articlesApi, clientsApi, commandesApi, ApiError } from '@/lib/api'

interface OrderLine {
  id: string
  article: Article | null
  quantite: number
}

export default function NewOrderPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [lines, setLines] = useState<OrderLine[]>([
    { id: '1', article: null, quantite: 1 },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [clientsResponse, articlesResponse] = await Promise.all([
          clientsApi.list(),
          articlesApi.list(),
        ])
        setClients(clientsResponse.results)
        setArticles(articlesResponse.results)
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Impossible de charger le formulaire.'
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadFormData()
  }, [])

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: Date.now().toString(), article: null, quantite: 1 },
    ])
  }

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines((prev) => prev.filter((line) => line.id !== id))
    }
  }

  const updateLine = (id: string, field: 'article' | 'quantite', value: Article | null | number) => {
    setLines((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, [field]: value } : line
      )
    )
  }

  const calculateTotal = () => {
    return lines.reduce((sum, line) => {
      if (line.article) {
        return sum + parseFloat(line.article.prix_unitaire) * line.quantite
      }
      return sum
    }, 0)
  }

  const handleSubmit = async () => {
    if (!selectedClient) {
      toast.error('Veuillez selectionner un client')
      return
    }

    const validLines = lines.filter((line) => line.article !== null)
    if (validLines.length === 0) {
      toast.error('Veuillez ajouter au moins un article')
      return
    }

    const insufficientStockLine = validLines.find(
      (line) => line.article && line.quantite > line.article.quantite_stock
    )
    if (insufficientStockLine?.article) {
      toast.error(`Stock insuffisant pour ${insufficientStockLine.article.nom}`)
      return
    }

    setIsSubmitting(true)

    try {
      const createdOrder = await commandesApi.create({
        client: parseInt(selectedClient, 10),
        lignes: validLines
          .filter((line): line is OrderLine & { article: Article } => line.article !== null)
          .map((line) => ({
            article: line.article.id,
            quantite: line.quantite,
          })),
      })

      toast.success('Commande creee avec succes')
      router.push(`/orders/${createdOrder.id}`)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible de creer la commande.'
      toast.error(message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/orders')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nouvelle commande</h1>
          <p className="text-muted-foreground">
            Creer une nouvelle commande pour un client
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                Articles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lines.map((line, index) => (
                <div
                  key={line.id}
                  className="flex items-end gap-4 rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className="flex-1">
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Article {index + 1}</FieldLabel>
                        <Select
                          value={line.article?.id.toString() || ''}
                          onValueChange={(value) => {
                            const article = articles.find(
                              (a) => a.id.toString() === value
                            )
                            updateLine(line.id, 'article', article || null)
                          }}
                        >
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue placeholder="Selectionner un article" />
                          </SelectTrigger>
                          <SelectContent>
                            {articles.map((article) => (
                              <SelectItem
                                key={article.id}
                                value={article.id.toString()}
                              >
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  <span>{article.nom}</span>
                                  <span className="text-muted-foreground">
                                    - {formatCurrency(article.prix_unitaire)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                  </div>
                  <div className="w-24">
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Quantite</FieldLabel>
                        <Input
                          type="number"
                          min="1"
                          value={line.quantite}
                          onChange={(e) =>
                            updateLine(
                              line.id,
                              'quantite',
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="bg-input border-border"
                        />
                      </Field>
                    </FieldGroup>
                  </div>
                  <div className="w-32 text-right">
                    <p className="text-sm text-muted-foreground mb-1">Sous-total</p>
                    <p className="font-semibold">
                      {line.article
                        ? formatCurrency(
                            parseFloat(line.article.prix_unitaire) * line.quantite
                          )
                        : '-'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" onClick={addLine} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un article
              </Button>

              <Separator />

              <div className="flex justify-between text-lg font-bold text-card-foreground">
                <span>Total</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Selectionner un client</FieldLabel>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Choisir un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Articles</span>
                <span className="text-card-foreground">
                  {lines.filter((l) => l.article).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantite totale</span>
                <span className="text-card-foreground">
                  {lines.reduce((sum, l) => sum + (l.article ? l.quantite : 0), 0)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span className="text-card-foreground">Total</span>
                <span className="text-card-foreground">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
          >
            {isLoading ? 'Chargement...' : isSubmitting ? 'Creation en cours...' : 'Creer la commande'}
          </Button>
        </div>
      </div>
    </div>
  )
}
