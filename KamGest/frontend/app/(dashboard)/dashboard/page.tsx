'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/stats-card'
import { formatCurrency, formatDate, formatOrderStatus, getOrderStatusColor } from '@/lib/format'
import type { DashboardStats, Commande, Article } from '@/lib/types'
import { dashboardApi, articlesApi, ApiError } from '@/lib/api'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

const revenueData = [
  { name: 'Jan', value: 32000000 },
  { name: 'Fev', value: 28000000 },
  { name: 'Mar', value: 45000000 },
  { name: 'Avr', value: 38000000 },
  { name: 'Mai', value: 52000000 },
  { name: 'Jun', value: 48000000 },
]

const ordersData = [
  { name: 'Lun', commandes: 12 },
  { name: 'Mar', commandes: 19 },
  { name: 'Mer', commandes: 15 },
  { name: 'Jeu', commandes: 22 },
  { name: 'Ven', commandes: 28 },
  { name: 'Sam', commandes: 18 },
  { name: 'Dim', commandes: 8 },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [lowStockArticles, setLowStockArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsResponse, lowStockResponse] = await Promise.all([
          dashboardApi.getStats(),
          articlesApi.getLowStock(),
        ])
        setStats(statsResponse)
        setLowStockArticles(lowStockResponse.slice(0, 5))
      } catch (error) {
        console.error(error)
        if (error instanceof ApiError) {
          setStats(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">
            {isLoading ? 'Chargement des donnees...' : 'Impossible de charger les donnees.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de votre activite commerciale
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Chiffre d'affaires"
          value={formatCurrency(stats.chiffre_affaires)}
          description="ce mois"
          icon={TrendingUp}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Total Commandes"
          value={stats.total_commandes}
          description={`${stats.commandes_en_cours} en cours`}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Total Clients"
          value={stats.total_clients}
          description="clients enregistres"
          icon={Users}
        />
        <StatsCard
          title="Total Articles"
          value={stats.total_articles}
          description={`${stats.articles_en_rupture} en alerte`}
          icon={Package}
          className={stats.articles_en_rupture > 0 ? 'border-warning/50' : ''}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="col-span-full bg-card border-border lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-card-foreground">Evolution du chiffre d&apos;affaires</CardTitle>
            <CardDescription>Revenus des 6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenus']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-full bg-card border-border lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-card-foreground">Commandes par jour</CardTitle>
            <CardDescription>Activite de la semaine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar
                    dataKey="commandes"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Low Stock */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-card-foreground">Commandes recentes</CardTitle>
              <CardDescription>Les dernieres commandes passees</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders" className="flex items-center gap-1">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.commandes_recentes.map((order: Commande) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-card-foreground">{order.numero}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.client_detail?.nom} - {formatDate(order.date_commande)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getOrderStatusColor(order.statut)}>
                      {formatOrderStatus(order.statut)}
                    </Badge>
                    <span className="font-medium text-card-foreground">
                      {formatCurrency(order.montant_total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertes de stock
              </CardTitle>
              <CardDescription>Articles en dessous du seuil d&apos;alerte</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/stock" className="flex items-center gap-1">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-card-foreground">{article.nom}</p>
                    <p className="text-sm text-muted-foreground">{article.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-warning">{article.quantite_stock}</p>
                    <p className="text-xs text-muted-foreground">
                      Seuil: {article.seuil_alerte}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
