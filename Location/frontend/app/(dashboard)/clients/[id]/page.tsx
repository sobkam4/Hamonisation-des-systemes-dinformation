"use client"

import { use, useMemo, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, Phone, MapPin, CreditCard, Calendar, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/status-badge"
import { PageHeader } from "@/components/page-header"
import { useApiData } from "@/lib/api-context"
import { usePermissions } from "@/lib/permissions"
import { formatMontant, formatDate, getInitiales } from "@/lib/format"
import { toast } from "sonner"

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { getClient, getContratsForClient, getPaiementsForContrat, getBien, loadClients, loadContrats, loadPaiements, deleteClient, updateClient } = useApiData()
  const { canEdit, canDelete } = usePermissions()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    cin: "",
  })
  
  useEffect(() => {
    loadClients()
    loadContrats()
    loadPaiements()
  }, [loadClients, loadContrats, loadPaiements])

  // Rafraîchir automatiquement les données quand la page devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadClients()
        loadContrats()
        loadPaiements()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadClients, loadContrats, loadPaiements])

  const client = getClient(id)
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Client non trouve</p>
        <Button variant="ghost" className="mt-4" asChild>
          <Link href="/clients"><ArrowLeft className="mr-2 size-4" /> Retour aux clients</Link>
        </Button>
      </div>
    )
  }

  const clientContrats = getContratsForClient(client.id)

  const totalPaiements = useMemo(() => {
    return clientContrats.reduce((total, ct) => {
      const paiements = getPaiementsForContrat(ct.id)
      return total + paiements.filter((p) => p.statut === "Payé").reduce((s, p) => s + p.montant, 0)
    }, 0)
  }, [clientContrats, getPaiementsForContrat])

  const paiementsRetard = useMemo(() => {
    return clientContrats.reduce((total, ct) => {
      const paiements = getPaiementsForContrat(ct.id)
      return total + paiements.filter((p) => p.statut === "En retard").length
    }, 0)
  }, [clientContrats, getPaiementsForContrat])

  const handleEditClick = () => {
    // Pré-remplir le formulaire avec les données du client
    setForm({
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse || "",
      cin: client.cin || "",
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!form.nom || !form.prenom || !form.email || !form.telephone) {
      toast.error("Veuillez remplir tous les champs obligatoires.")
      return
    }

    const updatedClient = {
      nom: form.nom,
      prenom: form.prenom,
      email: form.email,
      telephone: form.telephone,
      adresse: form.adresse,
      piece_identite: "CIN",
      numero_piece_identite: form.cin,
    }

    const updated = await updateClient(client.id, updatedClient)
    if (updated) {
      setEditDialogOpen(false)
      toast.success("Client mis à jour avec succès")
    }
  }

  const handleDelete = async () => {
    if (!canDelete(client as any)) {
      toast.error("Vous n'avez pas les droits pour supprimer ce client.")
      return
    }
    
    if (clientContrats.length > 0) {
      toast.error(`Impossible de supprimer ce client car il est associé à ${clientContrats.length} contrat(s). Veuillez d'abord supprimer ou modifier les contrats associés.`)
      return
    }
    
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      const deleted = await deleteClient(client.id)
      if (deleted) {
        router.push("/clients")
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clients"><ArrowLeft className="size-4" /></Link>
        </Button>
        <PageHeader title={`${client.prenom} ${client.nom}`} description={`Client depuis le ${formatDate(client.dateInscription)}`}>
          {canEdit(client as any) && (
            <>
              <Button variant="outline" size="sm" onClick={handleEditClick}>
                <Pencil className="mr-2 size-3.5" /> Modifier
              </Button>
              {canDelete(client as any) && (
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="mr-2 size-3.5" /> Supprimer
                </Button>
              )}
            </>
          )}
        </PageHeader>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Info Card */}
        <Card className="lg:col-span-2 gap-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Avatar className="size-14">
                <AvatarFallback className="bg-primary/15 text-primary text-lg">
                  {getInitiales(client.nom, client.prenom)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telephone</p>
                    <p className="text-sm font-medium">{client.telephone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="text-sm font-medium">{client.adresse}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">CIN</p>
                    <p className="text-sm font-medium">{client.cin}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="gap-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resume</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">Total paye</p>
              <p className="mt-0.5 text-xl font-bold text-primary">{formatMontant(totalPaiements)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Contrats</p>
                <p className="mt-0.5 text-lg font-bold">{clientContrats.length}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Retards</p>
                <p className={`mt-0.5 text-lg font-bold ${paiementsRetard > 0 ? "text-destructive-foreground" : "text-success"}`}>
                  {paiementsRetard}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contrats */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historique des contrats</CardTitle>
          <CardDescription>{clientContrats.length} contrat(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Bien</TableHead>
                <TableHead className="hidden sm:table-cell">Periode</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientContrats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Aucun contrat pour ce client
                  </TableCell>
                </TableRow>
              ) : (
                clientContrats.map((ct) => {
                  const bien = getBien(ct.bienId)
                  return (
                    <TableRow key={ct.id}>
                      <TableCell>
                        <Link href={`/contrats/${ct.id}`} className="font-medium text-primary hover:underline">{ct.reference}</Link>
                      </TableCell>
                      <TableCell>
                        {bien ? (
                          <Link href={`/biens/${bien.id}`} className="hover:underline">{bien.nom}</Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3 text-muted-foreground" />
                          {formatDate(ct.dateDebut)} - {formatDate(ct.dateFin)}
                        </div>
                      </TableCell>
                      <TableCell>{formatMontant(ct.montantMensuel)}/mois</TableCell>
                      <TableCell><StatusBadge status={ct.statut} /></TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>Modifiez les informations du client.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-prenom">Prenom *</Label>
                <Input id="edit-prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} placeholder="Sekou" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-nom">Nom *</Label>
                <Input id="edit-nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ouattara" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input id="edit-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="sekou@mail.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-telephone">Telephone *</Label>
                <Input id="edit-telephone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+225 07 12 34 56" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-adresse">Adresse</Label>
                <Input id="edit-adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Abidjan, Cocody" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-cin">CIN</Label>
                <Input id="edit-cin" value={form.cin} onChange={(e) => setForm({ ...form, cin: e.target.value })} placeholder="CI0012345678" />
              </div>
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
