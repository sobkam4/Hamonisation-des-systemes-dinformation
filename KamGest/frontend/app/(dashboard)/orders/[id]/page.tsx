'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package, Printer, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  formatCurrency,
  formatDate,
  formatOrderStatus,
  getOrderStatusColor,
} from '@/lib/format'
import type { Commande, OrderStatus } from '@/lib/types'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { commandesApi, clientsApi, facturesApi, ApiError } from '@/lib/api'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [commande, setCommande] = useState<Commande | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const orderId = Number(params.id)
    if (Number.isNaN(orderId)) {
      setIsLoading(false)
      return
    }

    const loadOrder = async () => {
      try {
        const order = await commandesApi.get(orderId)
        try {
          const client = await clientsApi.get(order.client)
          setCommande({ ...order, client_detail: client })
        } catch {
          setCommande(order)
        }
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Impossible de charger la commande.'
        toast.error(message)
        setCommande(null)
      } finally {
        setIsLoading(false)
      }
    }

    void loadOrder()
  }, [params.id])

  const updateStatus = async (newStatus: OrderStatus) => {
    if (!commande) return

    try {
      const updatedOrder = await commandesApi.updateStatus(commande.id, newStatus)
      setCommande((current) =>
        current ? { ...updatedOrder, client_detail: current.client_detail } : updatedOrder
      )
      toast.success(`Statut mis a jour: ${formatOrderStatus(newStatus)}`)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible de mettre a jour la commande.'
      toast.error(message)
    }
  }

  const handleDownloadInvoice = async () => {
    if (!commande) return

    try {
      const blob = await facturesApi.downloadPdf(commande.id)
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible de telecharger la facture.'
      toast.error(message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!commande) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Commande non trouvee</p>
        <Button variant="outline" onClick={() => router.push('/orders')}>
          Retour aux commandes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/orders')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {commande.numero}
              </h1>
              <Badge className={getOrderStatusColor(commande.statut)}>
                {formatOrderStatus(commande.statut)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Creee le {formatDate(commande.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadInvoice}>
            <FileText className="mr-2 h-4 w-4" />
            Facture
          </Button>
          {commande.statut === 'brouillon' && (
            <Button onClick={() => updateStatus('confirmee')}>
              Confirmer la commande
            </Button>
          )}
          {commande.statut === 'confirmee' && (
            <Button onClick={() => updateStatus('livree')}>
              Marquer livree
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                Articles commandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commande.lignes.map((ligne) => (
                  <div
                    key={ligne.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {ligne.article_detail?.nom || `Article #${ligne.article}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {ligne.article_detail?.reference} - {formatCurrency(ligne.prix_unitaire)} x {ligne.quantite}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-card-foreground">
                      {formatCurrency(ligne.sous_total)}
                    </p>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-lg font-bold text-card-foreground">
                <span>Total</span>
                <span>{formatCurrency(commande.montant_total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-card-foreground">
                  {commande.client_detail?.nom}
                </p>
              </div>
              {commande.client_detail?.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-card-foreground">
                    {commande.client_detail.email}
                  </p>
                </div>
              )}
              {commande.client_detail?.telephone && (
                <div>
                  <p className="text-sm text-muted-foreground">Telephone</p>
                  <p className="text-card-foreground">
                    {commande.client_detail.telephone}
                  </p>
                </div>
              )}
              {commande.client_detail?.adresse && (
                <div>
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p className="text-card-foreground">
                    {commande.client_detail.adresse}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Historique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Creee le</span>
                <span className="text-card-foreground">
                  {formatDate(commande.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mise a jour</span>
                <span className="text-card-foreground">
                  {formatDate(commande.updated_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          {commande.statut !== 'annulee' && commande.statut !== 'livree' && (
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => updateStatus('annulee')}
            >
              Annuler la commande
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
