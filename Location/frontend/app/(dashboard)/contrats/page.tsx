"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/status-badge"
import { PageHeader } from "@/components/page-header"
import { useApiData } from "@/lib/api-context"
import { formatMontant, formatDate } from "@/lib/format"
import { toast } from "sonner"
import { usePermissions } from "@/lib/permissions"

export default function ContratsPage() {
  const { contrats, clients, biens, loading, loadContrats, loadClients, loadBiens, createContrat, deleteContrat, getClient, getBien } = useApiData()
  const { canEdit, canDelete } = usePermissions()
  const [search, setSearch] = useState("")
  const [filterStatut, setFilterStatut] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    loadContrats()
    loadClients()
    loadBiens()
  }, [loadContrats, loadClients, loadBiens])

  // Rafraîchir automatiquement les données quand la page devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadContrats()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadContrats])

  // Rafraîchir périodiquement les statuts (toutes les 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      loadContrats()
    }, 5 * 60 * 1000) // 5 minutes
    return () => clearInterval(interval)
  }, [loadContrats])

  const handleDeleteContrat = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce contrat ?")) {
      return
    }
    const ok = await deleteContrat(id)
    if (!ok) {
      toast.error("Erreur lors de la suppression du contrat")
    }
  }

  // Recharger les données quand le dialog s'ouvre pour avoir les éléments récemment créés
  useEffect(() => {
    if (dialogOpen) {
      loadBiens()
      loadClients()
    }
  }, [dialogOpen, loadBiens, loadClients])

  const [form, setForm] = useState({
    clientId: "",
    bienId: "",
    dateDebut: "",
    dateFin: "",
    montantMensuel: "",
    caution: "",
  })

  // Biens disponibles pour nouveau contrat
  const biensDisponibles = useMemo(() => {
    return biens.filter((b: any) => {
      const statut = (b.statut || '').toLowerCase()
      const statutDisplay = (b.statut_display || '').toLowerCase()
      return statut === 'disponible' || statutDisplay === 'disponible'
    })
  }, [biens])

  const filtered = useMemo(() => {
    return contrats.filter((ct: any) => {
      const client = getClient(ct.client || ct.clientId)
      const bien = getBien(ct.bien || ct.bienId)
      const matchSearch =
        (ct.reference || ct.numero || "").toLowerCase().includes(search.toLowerCase()) ||
        `${client?.prenom || ""} ${client?.nom || ""}`.toLowerCase().includes(search.toLowerCase()) ||
        (bien?.nom || "").toLowerCase().includes(search.toLowerCase())
      const matchStatut = filterStatut === "all" || ct.statut === filterStatut || ct.statut_display === filterStatut
      return matchSearch && matchStatut
    })
  }, [contrats, search, filterStatut, getClient, getBien])

  const handleBienSelect = (bienId: string) => {
    const bien = getBien(bienId) as any
    setForm({
      ...form,
      bienId,
      montantMensuel: bien ? (bien.prix_location || bien.prixLocation || 0).toString() : form.montantMensuel,
      caution: bien ? ((bien.prix_location || bien.prixLocation || 0) * 2).toString() : form.caution,
    })
  }

  const handleSubmit = async () => {
    if (!form.clientId || !form.bienId || !form.dateDebut || !form.dateFin || !form.montantMensuel) {
      toast.error("Veuillez remplir tous les champs obligatoires.")
      return
    }

    const newContrat = {
      client: Number(form.clientId),
      bien: Number(form.bienId),
      date_debut: form.dateDebut,
      date_fin: form.dateFin,
      montant_mensuel: Number(form.montantMensuel),
      caution: Number(form.caution) || 0,
    }

    const created = await createContrat(newContrat)
    if (created) {
      setDialogOpen(false)
      setForm({ clientId: "", bienId: "", dateDebut: "", dateFin: "", montantMensuel: "", caution: "" })
    }
  }

  if (loading.contrats && contrats.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Chargement des contrats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Gestion des Contrats" description={`${contrats.length} contrats au total`}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 size-4" /> Nouveau contrat</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau contrat</DialogTitle>
              <DialogDescription>Creez un nouveau contrat de location.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Client *</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selectionner un client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.prenom} {c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Bien * <span className="text-xs text-muted-foreground">(biens disponibles uniquement)</span></Label>
                <Select value={form.bienId} onValueChange={handleBienSelect}>
                  <SelectTrigger><SelectValue placeholder="Selectionner un bien" /></SelectTrigger>
                  <SelectContent>
                      {biensDisponibles.length === 0 ? (
                      <SelectItem value="none" disabled>Aucun bien disponible</SelectItem>
                    ) : (
                      biensDisponibles.map((b: any) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.nom} - {formatMontant(b.prix_location || b.prixLocation || 0)}/mois</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dateDebut">Date debut *</Label>
                  <Input id="dateDebut" type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dateFin">Date fin *</Label>
                  <Input id="dateFin" type="date" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="montantMensuel">Loyer mensuel (GNF) *</Label>
                  <Input id="montantMensuel" type="number" value={form.montantMensuel} onChange={(e) => setForm({ ...form, montantMensuel: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="caution">Caution (GNF)</Label>
                  <Input id="caution" type="number" value={form.caution} onChange={(e) => setForm({ ...form, caution: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={biensDisponibles.length === 0}>Creer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Filters */}
      <Card className="gap-0">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher par reference, client, bien..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Actif">Actif</SelectItem>
                <SelectItem value="Terminé">Termine</SelectItem>
                <SelectItem value="Résilié">Resilie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="gap-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Bien</TableHead>
                <TableHead className="hidden sm:table-cell">Debut</TableHead>
                <TableHead className="hidden sm:table-cell">Fin</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[130px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Aucun contrat trouve
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ct: any) => {
                  const client = getClient(ct.client || ct.clientId)
                  const bien = getBien(ct.bien || ct.bienId)
                  return (
                    <TableRow key={ct.id} className="hover:bg-accent/50">
                      <TableCell>
                        <Link href={`/contrats/${ct.id}`} className="font-medium text-primary hover:underline">
                          {ct.reference || ct.numero || `CTR-${ct.id}`}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {client ? (
                          <Link href={`/clients/${client.id}`} className="hover:underline">
                            {client.prenom} {client.nom}
                          </Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {bien ? (
                          <Link href={`/biens/${bien.id}`} className="hover:underline">{(bien as any).nom}</Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(ct.date_debut || ct.dateDebut)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(ct.date_fin || ct.dateFin)}</TableCell>
                      <TableCell className="font-medium">{formatMontant(ct.montant_mensuel || ct.montantMensuel || 0)}</TableCell>
                      <TableCell><StatusBadge status={ct.statut_display || ct.statut} /></TableCell>
                      <TableCell className="space-x-2 text-right">
                        {canEdit(ct as any) && (
                          <Button variant="outline" size="icon" asChild>
                            <Link href={`/contrats/${ct.id}`}>
                              <Pencil className="size-3.5" />
                            </Link>
                          </Button>
                        )}
                        {canDelete(ct as any) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteContrat(ct.id)}
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
