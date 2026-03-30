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
import { usePermissions } from "@/lib/permissions"
import { formatMontant, formatDate } from "@/lib/format"
import { toast } from "sonner"
import type { TypePaiement } from "@/lib/types"

export default function PaiementsPage() {
  const { paiements, contrats, loading, loadPaiements, loadContrats, loadClients, loadBiens, createPaiement, updatePaiement, deletePaiement, getContrat, getClient, getBien } = useApiData()
  const { canEdit, canDelete } = usePermissions()
  const [search, setSearch] = useState("")
  const [filterStatut, setFilterStatut] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedPaiement, setSelectedPaiement] = useState<any>(null)

  useEffect(() => {
    loadPaiements()
    loadContrats()
    loadClients()
    loadBiens()
  }, [loadPaiements, loadContrats, loadClients, loadBiens])

  // Recharger les contrats quand le dialog s'ouvre pour avoir les contrats récemment créés
  useEffect(() => {
    if (dialogOpen) {
      loadContrats()
    }
  }, [dialogOpen, loadContrats])

  const [form, setForm] = useState({
    contratId: "",
    montant: "",
    datePaiement: "",
    dateEcheance: "",
    moisPaye: "",
    type: "Virement" as TypePaiement,
    notes: "",
  })

  const [editForm, setEditForm] = useState({
    contratId: "",
    montant: "",
    datePaiement: "",
    dateEcheance: "",
    moisPaye: "",
    type: "Virement" as TypePaiement,
    notes: "",
  })

  // Générer les options de mois (12 mois de l'année)
  const getMoisOptions = () => {
    const mois = [
      { value: "01", label: "Janvier" },
      { value: "02", label: "Février" },
      { value: "03", label: "Mars" },
      { value: "04", label: "Avril" },
      { value: "05", label: "Mai" },
      { value: "06", label: "Juin" },
      { value: "07", label: "Juillet" },
      { value: "08", label: "Août" },
      { value: "09", label: "Septembre" },
      { value: "10", label: "Octobre" },
      { value: "11", label: "Novembre" },
      { value: "12", label: "Décembre" },
    ]
    const currentYear = new Date().getFullYear()
    const options: { value: string; label: string }[] = []
    
    // Ajouter les 12 mois de l'année en cours
    mois.forEach((m) => {
      options.push({
        value: `${currentYear}-${m.value}`,
        label: `${m.label} ${currentYear}`,
      })
    })
    
    // Ajouter aussi les 12 mois de l'année précédente
    mois.forEach((m) => {
      options.push({
        value: `${currentYear - 1}-${m.value}`,
        label: `${m.label} ${currentYear - 1}`,
      })
    })
    
    // Ajouter aussi les 12 mois de l'année suivante
    mois.forEach((m) => {
      options.push({
        value: `${currentYear + 1}-${m.value}`,
        label: `${m.label} ${currentYear + 1}`,
      })
    })
    
    return options
  }

  const moisOptions = getMoisOptions()

  const paiementsEnrichis = useMemo(() => {
    return paiements.map((p: any) => {
      const contrat = getContrat(p.contrat || p.contratId)
      const client = contrat ? getClient((contrat as any).client || (contrat as any).clientId) : undefined
      const bien = contrat ? getBien((contrat as any).bien || (contrat as any).bienId) : undefined
      return { ...p, contrat, client, bien }
    })
  }, [paiements, getContrat, getClient, getBien])

  const filtered = useMemo(() => {
    const searchLower = (search || "").toLowerCase()
    return paiementsEnrichis.filter((p) => {
      const matchSearch = !searchLower ||
        (p.reference || "").toLowerCase().includes(searchLower) ||
        (p.client?.nom || "").toLowerCase().includes(searchLower) ||
        (p.client?.prenom || "").toLowerCase().includes(searchLower) ||
        ((p.bien as any)?.nom || "").toLowerCase().includes(searchLower)
      const matchStatut = filterStatut === "all" || p.statut === filterStatut
      return matchSearch && matchStatut
    })
  }, [paiementsEnrichis, search, filterStatut])

  const handleSubmit = async () => {
    if (!form.contratId || !form.montant || !form.datePaiement || !form.dateEcheance) {
      toast.error("Veuillez remplir tous les champs obligatoires.")
      return
    }

    const newPaiement = {
      contrat: Number(form.contratId),
      montant: Number(form.montant),
      date_paiement: form.datePaiement,
      date_echeance: form.dateEcheance,
      mois_paye: form.moisPaye || undefined,
      type_paiement: form.type,
      notes: form.notes || undefined,
    }

    const created = await createPaiement(newPaiement)
    if (created) {
      setDialogOpen(false)
      setForm({
        contratId: "",
        montant: "",
        datePaiement: "",
        dateEcheance: "",
        moisPaye: "",
        type: "Virement",
        notes: "",
      })
      // Les données sont déjà rafraîchies dans createPaiement
    }
  }

  const handleEditClick = (paiement: any) => {
    setSelectedPaiement(paiement)
    setEditForm({
      contratId: String(paiement.contrat || paiement.contratId || ""),
      montant: String(paiement.montant || ""),
      datePaiement: paiement.date_paiement || paiement.datePaiement || "",
      dateEcheance: paiement.date_echeance || paiement.dateEcheance || "",
      moisPaye: paiement.mois_paye || paiement.moisPaye || "",
      type: (paiement.type_paiement || paiement.type || "Virement") as TypePaiement,
      notes: paiement.notes || "",
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editForm.contratId || !editForm.montant || !editForm.datePaiement || !editForm.dateEcheance) {
      toast.error("Veuillez remplir tous les champs obligatoires.")
      return
    }

    if (!selectedPaiement) return

    const updated = await updatePaiement(selectedPaiement.id, {
      contratId: editForm.contratId,
      montant: Number(editForm.montant),
      datePaiement: editForm.datePaiement,
      dateEcheance: editForm.dateEcheance,
      moisPaye: editForm.moisPaye || undefined,
      type: editForm.type,
      notes: editForm.notes || undefined,
    })

    if (updated) {
      setEditDialogOpen(false)
      setSelectedPaiement(null)
    }
  }

  const handleDelete = async (paiement: any) => {
    if (!canDelete(paiement as any)) {
      toast.error("Vous n'avez pas les droits pour supprimer ce paiement.")
      return
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer le paiement ${paiement.reference || paiement.numero || `PAY-${paiement.id}`} ?`)) {
      await deletePaiement(paiement.id)
    }
  }

  const contratsActifs = useMemo(() => {
    return contrats.filter((c: any) => {
      const statut = (c.statut || '').toLowerCase()
      const statutDisplay = (c.statut_display || '').toLowerCase()
      // Inclure les contrats actifs et en attente (qui peuvent recevoir des paiements)
      return statut === 'actif' || statutDisplay === 'actif' || 
             statut === 'en_attente' || statutDisplay === 'en attente' ||
             statutDisplay === 'en attente'
    })
  }, [contrats])

  if (loading.paiements && paiements.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Chargement des paiements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Gestion des Paiements" description={`${paiements.length} paiements enregistres`}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 size-4" /> Nouveau paiement</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau paiement</DialogTitle>
              <DialogDescription>Enregistrez un nouveau paiement de loyer.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Contrat *</Label>
                <Select value={form.contratId} onValueChange={(v) => setForm({ ...form, contratId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selectionner un contrat" /></SelectTrigger>
                  <SelectContent>
                    {contratsActifs.length === 0 ? (
                      <SelectItem value="none" disabled>Aucun contrat actif</SelectItem>
                    ) : (
                      contratsActifs.map((c: any) => {
                        const client = getClient(c.client || c.clientId)
                        const bien = getBien(c.bien || c.bienId)
                        return (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.reference || c.numero || `CTR-${c.id}`} - {client?.prenom} {client?.nom} - {(bien as any)?.nom}
                          </SelectItem>
                        )
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="montant">Montant (GNF) *</Label>
                  <Input id="montant" type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Type de paiement *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TypePaiement })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Espèces">Espèces</SelectItem>
                      <SelectItem value="Virement">Virement</SelectItem>
                      <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                      <SelectItem value="Chèque">Chèque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Mois payé</Label>
                <Select value={form.moisPaye} onValueChange={(v) => setForm({ ...form, moisPaye: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner le mois payé" /></SelectTrigger>
                  <SelectContent>
                    {moisOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="datePaiement">Date de paiement *</Label>
                  <Input id="datePaiement" type="date" value={form.datePaiement} onChange={(e) => setForm({ ...form, datePaiement: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dateEcheance">Date d'échéance *</Label>
                  <Input id="dateEcheance" type="date" value={form.dateEcheance} onChange={(e) => setForm({ ...form, dateEcheance: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes optionnelles" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={contratsActifs.length === 0}>Enregistrer</Button>
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
                <SelectItem value="Payé">Payé</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
                <SelectItem value="Partiel">Partiel</SelectItem>
                <SelectItem value="En retard">En retard</SelectItem>
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
                <TableHead>Montant</TableHead>
                <TableHead className="hidden sm:table-cell">Date paiement</TableHead>
                <TableHead className="hidden sm:table-cell">Échéance</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    Aucun paiement trouve
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p: any) => (
                  <TableRow key={p.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">{p.reference || p.numero || `PAY-${p.id}`}</TableCell>
                    <TableCell>
                      {p.client ? (
                        <Link href={`/clients/${p.client.id}`} className="hover:underline">
                          {p.client.prenom} {p.client.nom}
                        </Link>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {p.bien ? (
                        <Link href={`/biens/${p.bien.id}`} className="hover:underline">{(p.bien as any).nom}</Link>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="font-medium">{formatMontant(p.montant || 0)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(p.date_paiement || p.datePaiement)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(p.date_echeance || p.dateEcheance)}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{p.type_paiement || p.type}</TableCell>
                    <TableCell><StatusBadge status={p.statut_display || p.statut} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {canEdit(p as any) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClick(p)
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        {canDelete(p as any) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(p)
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le paiement</DialogTitle>
            <DialogDescription>Modifiez les informations du paiement.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Contrat *</Label>
              <Select value={editForm.contratId} onValueChange={(v) => setEditForm({ ...editForm, contratId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un contrat" /></SelectTrigger>
                <SelectContent>
                  {contratsActifs.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun contrat actif</SelectItem>
                  ) : (
                    contratsActifs.map((c: any) => {
                      const client = getClient(c.client || c.clientId)
                      const bien = getBien(c.bien || c.bienId)
                      return (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.reference || c.numero || `CTR-${c.id}`} - {client?.prenom} {client?.nom} - {(bien as any)?.nom}
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-montant">Montant (GNF) *</Label>
                <Input id="edit-montant" type="number" value={editForm.montant} onChange={(e) => setEditForm({ ...editForm, montant: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Type de paiement *</Label>
                <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v as TypePaiement })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Espèces">Espèces</SelectItem>
                    <SelectItem value="Virement">Virement</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                    <SelectItem value="Chèque">Chèque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Mois payé</Label>
              <Select value={editForm.moisPaye} onValueChange={(v) => setEditForm({ ...editForm, moisPaye: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner le mois payé" /></SelectTrigger>
                <SelectContent>
                  {moisOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-datePaiement">Date de paiement *</Label>
                <Input id="edit-datePaiement" type="date" value={editForm.datePaiement} onChange={(e) => setEditForm({ ...editForm, datePaiement: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-dateEcheance">Date d'échéance *</Label>
                <Input id="edit-dateEcheance" type="date" value={editForm.dateEcheance} onChange={(e) => setEditForm({ ...editForm, dateEcheance: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input id="edit-notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notes optionnelles" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleUpdate}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
