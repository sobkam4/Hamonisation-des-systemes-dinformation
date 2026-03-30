"use client"

import { use, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, CreditCard, User, Building2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { PageHeader } from "@/components/page-header"
import { useApiData } from "@/lib/api-context"
import { formatMontant, formatDate } from "@/lib/format"

export default function ContratDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const {
    getContrat,
    getClient,
    getBien,
    getPaiementsForContrat,
    loadContrats,
    loadClients,
    loadBiens,
    loadPaiements,
  } = useApiData()

  useEffect(() => {
    loadContrats()
    loadClients()
    loadBiens()
    loadPaiements()
  }, [loadContrats, loadClients, loadBiens, loadPaiements])

  // Rafraîchir automatiquement les données quand la page devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadContrats()
        loadPaiements()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadContrats, loadPaiements])

  const contrat = getContrat(id)

  if (!contrat) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Contrat non trouvé</p>
        <Button variant="ghost" className="mt-4" asChild>
          <Link href="/contrats">
            <ArrowLeft className="mr-2 size-4" /> Retour aux contrats
          </Link>
        </Button>
      </div>
    )
  }

  const client = getClient(contrat.clientId)
  const bien = getBien(contrat.bienId)
  const paiements = getPaiementsForContrat(contrat.id)

  const totalPaye = useMemo(() => {
    return paiements
      .filter((p) => p.statut === "Payé")
      .reduce((sum, p) => sum + p.montant, 0)
  }, [paiements])

  const paiementsRetard = useMemo(() => {
    return paiements.filter((p) => p.statut === "En retard").length
  }, [paiements])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/contrats">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <PageHeader
          title={contrat.reference || `Contrat ${contrat.id}`}
          description={
            client && bien
              ? `${client.prenom} ${client.nom} • ${bien.nom}`
              : client
              ? `${client.prenom} ${client.nom}`
              : bien
              ? bien.nom
              : undefined
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Informations contrat */}
        <Card className="lg:col-span-2 gap-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informations du contrat</CardTitle>
            <CardDescription>Détails principaux du contrat de location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  {client ? (
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {client.prenom} {client.nom}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">-</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Bien</p>
                  {bien ? (
                    <Link
                      href={`/biens/${bien.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {bien.nom}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">-</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Période</p>
                  <p className="text-sm font-medium">
                    {formatDate(contrat.dateDebut)} - {formatDate(contrat.dateFin)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={contrat.statut} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finances */}
        <Card className="gap-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Finances</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">Loyer mensuel</p>
              <p className="mt-0.5 text-xl font-bold text-primary">
                {formatMontant(contrat.montantMensuel)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Caution</p>
                <p className="mt-0.5 text-lg font-bold">
                  {formatMontant(contrat.caution)}
                </p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Total payé</p>
                <p className="mt-0.5 text-lg font-bold">
                  {formatMontant(totalPaye)}
                </p>
              </div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Paiements en retard</p>
              <p
                className={`mt-0.5 text-lg font-bold ${
                  paiementsRetard > 0
                    ? "text-destructive-foreground"
                    : "text-success"
                }`}
              >
                {paiementsRetard}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Paiements du contrat */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Paiements du contrat</CardTitle>
          <CardDescription>{paiements.length} paiement(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date paiement</TableHead>
                <TableHead className="hidden sm:table-cell">Date échéance</TableHead>
                <TableHead className="hidden md:table-cell">Mois payé</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paiements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Aucun paiement enregistré pour ce contrat
                  </TableCell>
                </TableRow>
              ) : (
                paiements.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.datePaiement)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatDate(p.dateEcheance)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {p.moisPaye || "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatMontant(p.montant)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {p.type}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.statut} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

