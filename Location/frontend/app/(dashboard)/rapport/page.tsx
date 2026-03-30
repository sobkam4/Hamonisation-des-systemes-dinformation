"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { KpiCard } from "@/components/kpi-card"
import { apiClient, API_ENDPOINTS } from "@/lib/api"
import { formatMontant, formatDate, getInitiales } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Users, FileText, CreditCard, Calendar, Search, Building2, CheckCircle2, XCircle, Mail, Phone } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface RapportData {
  client_id: number
  client_nom: string
  client_prenom: string
  client_nom_complet: string
  client_email: string
  client_telephone: string
  contrats: Array<{
    contrat_id: number
    contrat_reference: string
    bien_nom: string
    bien_id: number
    date_debut: string
    date_fin: string
    montant_mensuel: number
    statut: string
    statut_display: string
    mois_payes: string[]
    nombre_mois_payes: number
    total_paiements: number
  }>
}

export default function RapportPage() {
  const [loading, setLoading] = useState(true)
  const [rapportData, setRapportData] = useState<RapportData[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadRapport()
  }, [])

  const loadRapport = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get<{ total_clients: number; donnees: RapportData[] }>(
        API_ENDPOINTS.ANALYTICS.RAPPORT_CLIENTS_CONTRATS
      )
      setRapportData(response.data.donnees || [])
    } catch (error: any) {
      console.error('Erreur lors du chargement du rapport:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculer les statistiques
  const stats = useMemo(() => {
    const totalClients = rapportData.length
    const totalContrats = rapportData.reduce((sum, client) => sum + client.contrats.length, 0)
    const totalRevenus = rapportData.reduce((sum, client) => 
      sum + client.contrats.reduce((s, c) => s + c.total_paiements, 0), 0
    )
    const contratsActifs = rapportData.reduce((sum, client) => 
      sum + client.contrats.filter(c => c.statut === 'actif').length, 0
    )
    
    return { totalClients, totalContrats, totalRevenus, contratsActifs }
  }, [rapportData])

  // Filtrer les données
  const filteredData = useMemo(() => {
    if (!search) return rapportData
    
    const searchLower = search.toLowerCase()
    return rapportData.filter(client => 
      client.client_nom_complet.toLowerCase().includes(searchLower) ||
      client.client_email.toLowerCase().includes(searchLower) ||
      client.client_telephone.includes(search) ||
      client.contrats.some(c => 
        c.bien_nom.toLowerCase().includes(searchLower) ||
        c.contrat_reference.toLowerCase().includes(searchLower)
      )
    )
  }, [rapportData, search])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="inline-block size-8 animate-spin" />
          <p className="mt-4 text-sm text-muted-foreground">Chargement du rapport...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Rapport Clients - Contrats - Paiements" 
        description="Vue d'ensemble complète des clients, contrats et paiements"
      />

      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Clients"
          value={stats.totalClients.toString()}
          icon={Users}
          description="Avec contrat(s) actif(s)"
        />
        <KpiCard
          title="Total Contrats"
          value={stats.totalContrats.toString()}
          icon={FileText}
          description={`${stats.contratsActifs} actif(s)`}
        />
        <KpiCard
          title="Revenus Totaux"
          value={formatMontant(stats.totalRevenus)}
          icon={CreditCard}
          description="Paiements reçus"
        />
        <KpiCard
          title="Contrats Actifs"
          value={stats.contratsActifs.toString()}
          icon={CheckCircle2}
          description="En cours"
        />
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par client, email, téléphone, bien ou contrat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rapport détaillé</CardTitle>
              <CardDescription>
                Liste complète des clients, leurs contrats et les mois payés
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {filteredData.length} client(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Client</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Contrat</TableHead>
                  <TableHead className="font-semibold">Bien</TableHead>
                  <TableHead className="font-semibold">Période</TableHead>
                  <TableHead className="font-semibold">Montant mensuel</TableHead>
                  <TableHead className="font-semibold">Statut</TableHead>
                  <TableHead className="font-semibold">Mois payés</TableHead>
                  <TableHead className="font-semibold text-right">Total payé</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="size-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground font-medium">
                          {search ? "Aucun résultat trouvé" : "Aucun client avec contrat trouvé"}
                        </p>
                        {search && (
                          <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
                            Réinitialiser la recherche
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((client) =>
                    client.contrats.map((contrat, index) => (
                      <TableRow 
                        key={`${client.client_id}-${contrat.contrat_id}-${index}`}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {index === 0 && (
                          <>
                            <TableCell rowSpan={client.contrats.length} className="align-top">
                              <div className="flex items-center gap-3 py-2">
                                <Avatar className="size-10">
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {getInitiales(client.client_nom_complet)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-semibold text-sm">{client.client_nom_complet}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {client.contrats.length} contrat{client.contrats.length > 1 ? 's' : ''}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell rowSpan={client.contrats.length} className="align-top">
                              <div className="space-y-1 py-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="size-3.5 text-muted-foreground" />
                                  <span className="text-xs">{client.client_email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="size-3.5 text-muted-foreground" />
                                  <span className="text-xs">{client.client_telephone}</span>
                                </div>
                              </div>
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <Link 
                            href={`/contrats/${contrat.contrat_id}`}
                            className="font-medium text-primary hover:underline text-sm"
                          >
                            {contrat.contrat_reference}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/biens/${contrat.bien_id}`}
                            className="flex items-center gap-2 hover:underline text-sm"
                          >
                            <Building2 className="size-3.5 text-muted-foreground" />
                            <span>{contrat.bien_nom}</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="size-3.5 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="text-xs">{formatDate(contrat.date_debut)}</span>
                              <span className="text-xs text-muted-foreground">→ {formatDate(contrat.date_fin)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm">{formatMontant(contrat.montant_mensuel)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              contrat.statut === 'actif' ? 'default' :
                              contrat.statut === 'termine' ? 'secondary' :
                              contrat.statut === 'resilie' ? 'destructive' : 'outline'
                            }
                            className="text-xs"
                          >
                            {contrat.statut_display}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {contrat.mois_payes.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                              {contrat.mois_payes.slice(0, 3).map((mois, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className="text-xs bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300"
                                >
                                  {mois}
                                </Badge>
                              ))}
                              {contrat.mois_payes.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{contrat.mois_payes.length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <XCircle className="size-3.5" />
                              <span className="text-xs">Aucun mois payé</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-sm">{formatMontant(contrat.total_paiements)}</span>
                            {contrat.nombre_mois_payes > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {contrat.nombre_mois_payes} mois
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
