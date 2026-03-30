"use client"

import { useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { useApiData } from "@/lib/api-context"
import { formatMontant } from "@/lib/format"
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react"

export default function AnalysePage() {
  const { paiements, depenses, contrats, biens, loading, refreshAll } = useApiData()
  
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const stats = useMemo(() => {
    const totalRevenus = paiements
      .filter((p: any) => (p.statut === "paye" || p.statut === "Payé" || p.statut_display === "Payé"))
      .reduce((sum: number, p: any) => sum + (p.montant || 0), 0)

    const totalDepenses = depenses.reduce((sum: number, d: any) => sum + (d.montant || 0), 0)

    const beneficeNet = totalRevenus - totalDepenses

    const tauxOccupation = biens.length > 0
      ? (biens.filter((b: any) => (b.statut === "loue" || b.statut === "Loué" || b.statut_display === "Loué")).length / biens.length) * 100
      : 0

    const paiementsEnRetard = paiements.filter((p: any) => (p.statut === "en_retard" || p.statut === "En retard" || p.statut_display === "En retard")).length
    const montantEnRetard = paiements
      .filter((p: any) => (p.statut === "en_retard" || p.statut === "En retard" || p.statut_display === "En retard"))
      .reduce((sum: number, p: any) => sum + (p.montant || 0), 0)

    const revenusMensuels = paiements
      .filter((p: any) => (p.statut === "paye" || p.statut === "Payé" || p.statut_display === "Payé"))
      .reduce((acc: Record<string, number>, p: any) => {
        const dateStr = p.date_paiement || p.datePaiement
        if (dateStr) {
          const mois = new Date(dateStr).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })
          acc[mois] = (acc[mois] || 0) + (p.montant || 0)
        }
        return acc
      }, {} as Record<string, number>)

    const depensesMensuelles = depenses.reduce((acc: Record<string, number>, d: any) => {
      const dateStr = d.date
      if (dateStr) {
        const mois = new Date(dateStr).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })
        acc[mois] = (acc[mois] || 0) + (d.montant || 0)
      }
      return acc
    }, {} as Record<string, number>)

    return {
      totalRevenus,
      totalDepenses,
      beneficeNet,
      tauxOccupation,
      paiementsEnRetard,
      montantEnRetard,
      revenusMensuels,
      depensesMensuelles,
    }
  }, [paiements, depenses, biens])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Analyse Financiere" description="Vue d'ensemble de la performance financiere" />

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatMontant(stats.totalRevenus)}</div>
            <p className="text-xs text-muted-foreground">Tous les paiements recus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Depenses totales</CardTitle>
            <TrendingDown className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatMontant(stats.totalDepenses)}</div>
            <p className="text-xs text-muted-foreground">Toutes les depenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benefice net</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.beneficeNet >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatMontant(stats.beneficeNet)}
            </div>
            <p className="text-xs text-muted-foreground">Revenus - Depenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tauxOccupation.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{biens.filter((b: any) => (b.statut === "loue" || b.statut === "Loué" || b.statut_display === "Loué")).length} / {biens.length} biens</p>
          </CardContent>
        </Card>
      </div>

      {/* Paiements en retard */}
      {stats.paiementsEnRetard > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Paiements en retard</CardTitle>
            <CardDescription>Attention: {stats.paiementsEnRetard} paiement(s) en retard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatMontant(stats.montantEnRetard)}</div>
            <p className="text-sm text-muted-foreground mt-2">Montant total des paiements en retard</p>
          </CardContent>
        </Card>
      )}

      {/* Revenus mensuels */}
      <Card>
        <CardHeader>
          <CardTitle>Revenus par mois</CardTitle>
          <CardDescription>Evolution des revenus mensuels</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.revenusMensuels).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun revenu enregistre</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.revenusMensuels)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([mois, montant]) => (
                  <div key={mois} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{mois}</span>
                    <span className="text-sm font-bold text-green-600">{formatMontant(montant)}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Depenses mensuelles */}
      <Card>
        <CardHeader>
          <CardTitle>Depenses par mois</CardTitle>
          <CardDescription>Evolution des depenses mensuelles</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.depensesMensuelles).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune depense enregistree</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.depensesMensuelles)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([mois, montant]) => (
                  <div key={mois} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{mois}</span>
                    <span className="text-sm font-bold text-red-600">{formatMontant(montant)}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resume */}
      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
          <CardDescription>Statistiques generales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold mb-2">Contrats</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>Total: {contrats.length}</li>
                <li>Actifs: {contrats.filter((c: any) => (c.statut === "actif" || c.statut === "Actif" || c.statut_display === "Actif")).length}</li>
                <li>Termines: {contrats.filter((c: any) => (c.statut === "termine" || c.statut === "Terminé" || c.statut_display === "Terminé")).length}</li>
                <li>Resilies: {contrats.filter((c: any) => (c.statut === "resilie" || c.statut === "Résilié" || c.statut_display === "Résilié")).length}</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Biens</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>Total: {biens.length}</li>
                <li>Disponibles: {biens.filter((b: any) => (b.statut === "disponible" || b.statut === "Disponible" || b.statut_display === "Disponible")).length}</li>
                <li>Loues: {biens.filter((b: any) => (b.statut === "loue" || b.statut === "Loué" || b.statut_display === "Loué")).length}</li>
                <li>En maintenance: {biens.filter((b: any) => (b.statut === "maintenance" || b.statut === "En maintenance" || b.statut_display === "En maintenance")).length}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
