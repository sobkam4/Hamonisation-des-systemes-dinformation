"use client"

import { useMemo, useEffect } from "react"
import Link from "next/link"
import { Building2, Users, FileText, CreditCard, AlertTriangle, ArrowRight, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { KpiCard } from "@/components/kpi-card"
import { StatusBadge } from "@/components/status-badge"
import { PageHeader } from "@/components/page-header"
import { useApiData } from "@/lib/api-context"
import { formatMontant, formatDate, formatMois } from "@/lib/format"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts"

export default function DashboardPage() {
  const { biens, contrats, paiements, depenses, clients, loading, refreshAll, getClient, getBien } = useApiData()

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // Rafraîchir automatiquement les données quand la page devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAll()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshAll])

  // Rafraîchir périodiquement les statuts (toutes les 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll()
    }, 5 * 60 * 1000) // 5 minutes
    return () => clearInterval(interval)
  }, [refreshAll])

  const stats = useMemo(() => {
    const biensLoues = biens.filter((b) => b.statut === "Loue\u0301").length
    const contratsActifs = contrats.filter((c) => c.statut === "Actif")
    const revenusMois = contratsActifs.reduce((sum, c) => sum + c.montantMensuel, 0)
    const paiementsRetard = paiements.filter((p) => p.statut === "En retard").length

    return { totalBiens: biens.length, biensLoues, revenusMois, paiementsRetard }
  }, [biens, contrats, paiements])

  const derniersPaiements = useMemo(() => {
    return [...paiements]
      .filter((p) => p.datePaiement)
      .sort((a, b) => new Date(b.datePaiement).getTime() - new Date(a.datePaiement).getTime())
      .slice(0, 5)
  }, [paiements])

  const contratsExpiration = useMemo(() => {
    const now = new Date()
    const dans90Jours = new Date()
    dans90Jours.setDate(dans90Jours.getDate() + 90)
    return contrats
      .filter((c) => c.statut === "Actif" && new Date(c.dateFin) <= dans90Jours && new Date(c.dateFin) >= now)
      .sort((a, b) => new Date(a.dateFin).getTime() - new Date(b.dateFin).getTime())
  }, [contrats])

  // Calculer les revenus et dépenses par mois à partir des vraies données
  const chartData = useMemo(() => {
    // Calculer les revenus par mois (paiements payés)
    const revenusParMois: Record<string, number> = {}
    paiements
      .filter((p: any) => {
        const statut = p.statut || p.statut_display || ""
        return statut === "Payé" || statut === "paye" || statut === "payé"
      })
      .forEach((p: any) => {
        const dateStr = p.date_paiement || p.datePaiement
        if (dateStr) {
          const date = new Date(dateStr)
          const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          revenusParMois[moisKey] = (revenusParMois[moisKey] || 0) + (p.montant || 0)
        }
      })

    // Calculer les dépenses par mois
    const depensesParMois: Record<string, number> = {}
    depenses.forEach((d: any) => {
      const dateStr = d.date
      if (dateStr) {
        const date = new Date(dateStr)
        const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        depensesParMois[moisKey] = (depensesParMois[moisKey] || 0) + (d.montant || 0)
      }
    })

    // Générer les 6 derniers mois
    const maintenant = new Date()
    const moisData: Array<{ mois: string; revenus: number; depenses: number }> = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1)
      const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      
      moisData.push({
        mois: formatMois(`${moisKey}-01`),
        revenus: revenusParMois[moisKey] || 0,
        depenses: depensesParMois[moisKey] || 0,
      })
    }

    return moisData
  }, [paiements, depenses])

  const chartConfig = {
    revenus: { label: "Revenus", color: "var(--color-chart-1)" },
    depenses: { label: "Depenses", color: "var(--color-chart-5)" },
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre parc immobilier"
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Biens"
          value={stats.totalBiens.toString()}
          icon={Building2}
          description={`${stats.biensLoues} actuellement loue(s)`}
        />
        <KpiCard
          title="Biens Loues"
          value={stats.biensLoues.toString()}
          icon={TrendingUp}
          trend={{
            value: `${Math.round((stats.biensLoues / stats.totalBiens) * 100)}% d'occupation`,
            positive: true,
          }}
        />
        <KpiCard
          title="Revenus mensuels"
          value={formatMontant(stats.revenusMois)}
          icon={CreditCard}
          description="Contrats actifs"
        />
        <KpiCard
          title="Paiements en retard"
          value={stats.paiementsRetard.toString()}
          icon={AlertTriangle}
          className={stats.paiementsRetard > 0 ? "border-destructive/30" : ""}
          description={stats.paiementsRetard > 0 ? "Action requise" : "Aucun retard"}
        />
      </div>

      {/* Charts + Upcoming */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 gap-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenus vs Depenses</CardTitle>
            <CardDescription>6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenus"
                  stroke="var(--color-chart-1)"
                  fill="var(--color-chart-1)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="depenses"
                  stroke="var(--color-chart-5)"
                  fill="var(--color-chart-5)"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 gap-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contrats expirant bientot</CardTitle>
            <CardDescription>{"Dans les 90 prochains jours"}</CardDescription>
          </CardHeader>
          <CardContent>
            {contratsExpiration.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun contrat n{"'"}expire prochainement
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {contratsExpiration.map((ct) => {
                  const client = getClient(ct.clientId)
                  const bien = getBien(ct.bienId)
                  return (
                    <Link
                      key={ct.id}
                      href={`/contrats/${ct.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{ct.reference}</span>
                        <span className="text-xs text-muted-foreground">
                          {client?.prenom} {client?.nom} - {bien?.nom}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Expire le {formatDate(ct.dateFin)}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments Table */}
      <Card className="gap-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Derniers paiements</CardTitle>
              <CardDescription>Les 5 paiements les plus recents</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/paiements">
                Voir tout <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {derniersPaiements.map((p) => {
                const contrat = contrats.find((c) => c.id === p.contratId)
                const client = contrat ? getClient(contrat.clientId) : null
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.reference}</TableCell>
                    <TableCell>{client ? `${client.prenom} ${client.nom}` : "-"}</TableCell>
                    <TableCell>{formatMontant(p.montant)}</TableCell>
                    <TableCell>{formatDate(p.datePaiement)}</TableCell>
                    <TableCell><StatusBadge status={p.statut} /></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto justify-start gap-3 p-4" asChild>
          <Link href="/biens">
            <Building2 className="size-5 text-primary" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Gerer les biens</span>
              <span className="text-xs text-muted-foreground">{biens.length} biens</span>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto justify-start gap-3 p-4" asChild>
          <Link href="/clients">
            <Users className="size-5 text-primary" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Gerer les clients</span>
              <span className="text-xs text-muted-foreground">{clients.length} clients</span>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto justify-start gap-3 p-4" asChild>
          <Link href="/contrats">
            <FileText className="size-5 text-primary" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Gerer les contrats</span>
              <span className="text-xs text-muted-foreground">{contrats.filter((c) => c.statut === "Actif").length} actifs</span>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto justify-start gap-3 p-4" asChild>
          <Link href="/paiements">
            <CreditCard className="size-5 text-primary" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Suivi paiements</span>
              <span className="text-xs text-muted-foreground">{paiements.filter((p) => p.statut !== "Paye\u0301").length} en cours</span>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  )
}
