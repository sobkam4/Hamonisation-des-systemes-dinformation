"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, MapPin, Ruler, DoorOpen, Calendar, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import { PageHeader } from "@/components/page-header"
import { useApiData } from "@/lib/api-context"
import { usePermissions } from "@/lib/permissions"
import { formatMontant, formatDate } from "@/lib/format"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { TypeBien } from "@/lib/types"

export default function BienDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { getBien, getContratsForBien, getClient, loadBiens, loadContrats, loadClients, updateBien, deleteBien } = useApiData()
  const { canEdit, canDelete } = usePermissions()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [form, setForm] = useState({
    nom: "",
    type: "Appartement" as TypeBien,
    adresse: "",
    ville: "",
    superficie: "",
    nbPieces: "",
    prixLocation: "",
    description: "",
  })
  
  useEffect(() => {
    loadBiens()
    loadContrats()
    loadClients()
  }, [loadBiens, loadContrats, loadClients])

  // Rafraîchir automatiquement les données quand la page devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadBiens()
        loadContrats()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadBiens, loadContrats])

  const bien = getBien(id)
  if (!bien) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Bien non trouve</p>
        <Button variant="ghost" className="mt-4" asChild>
          <Link href="/biens"><ArrowLeft className="mr-2 size-4" /> Retour aux biens</Link>
        </Button>
      </div>
    )
  }

  const contratsBien = getContratsForBien(bien.id)
  const contratActif = contratsBien.find((c) => c.statut === "Actif")
  const aDesContrats = contratsBien.length > 0

  const handleEditClick = () => {
    // Pré-remplir le formulaire avec les données du bien
    const adresseParts = bien.adresse.split(',').map(s => s.trim())
    const adresse = adresseParts.slice(0, -1).join(', ')
    const ville = adresseParts[adresseParts.length - 1] || ''
    
    setForm({
      nom: bien.nom,
      type: bien.type,
      adresse: adresse,
      ville: ville,
      superficie: String(bien.superficie),
      nbPieces: String(bien.nbPieces),
      prixLocation: String(bien.prixLocation),
      description: bien.description || "",
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!form.nom || !form.type || !form.adresse || !form.ville || !form.prixLocation) {
      toast.error("Veuillez remplir tous les champs obligatoires.")
      return
    }

    // Mapper le type vers le format backend
    const typeMapping: Record<string, string> = {
      'Appartement': 'appartement',
      'Maison': 'maison',
      'Villa': 'villa',
      'Studio': 'studio',
      'Local commercial': 'local_commercial',
    }
    
    const updatedBien = {
      nom: form.nom,
      type_bien: typeMapping[form.type] || form.type.toLowerCase().replace(/\s+/g, '_'),
      adresse: `${form.adresse}, ${form.ville}`,
      superficie: Number(form.superficie) || 0,
      nombre_pieces: Number(form.nbPieces) || 1,
      prix_location: Number(form.prixLocation),
      description: form.description || "",
    }

    const updated = await updateBien(bien.id, updatedBien)
    if (updated) {
      setEditDialogOpen(false)
      toast.success("Bien mis à jour avec succès")
    }
  }

  const handleDelete = async () => {
    if (!canDelete(bien as any)) {
      toast.error("Vous n'avez pas les droits pour supprimer ce bien.")
      return
    }
    
    if (aDesContrats) {
      toast.error(`Impossible de supprimer ce bien car il est associé à ${contratsBien.length} contrat(s). Veuillez d'abord supprimer ou modifier les contrats associés.`)
      return
    }
    
    if (confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) {
      const deleted = await deleteBien(bien.id)
      if (deleted) {
        router.push("/biens")
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/biens"><ArrowLeft className="size-4" /></Link>
        </Button>
        <PageHeader title={bien.nom} description={`${bien.type} - ${bien.adresse}, ${bien.ville}`}>
          {canEdit(bien as any) && (
            <>
              <Button variant="outline" size="sm" onClick={handleEditClick}>
                <Pencil className="mr-2 size-3.5" /> Modifier
              </Button>
              {canDelete(bien as any) && (
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Informations</CardTitle>
              <StatusBadge status={bien.statut} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <MapPin className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Adresse</p>
                  <p className="text-sm font-medium">{bien.adresse}, {bien.ville}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Ruler className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Superficie</p>
                  <p className="text-sm font-medium">{bien.superficie} m2</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DoorOpen className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Nombre de pieces</p>
                  <p className="text-sm font-medium">{bien.nbPieces} pieces</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date d{"'"}ajout</p>
                  <p className="text-sm font-medium">{formatDate(bien.dateAjout)}</p>
                </div>
              </div>
            </div>
            {bien.description && (
              <div className="mt-4 rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="mt-1 text-sm">{bien.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Card */}
        <Card className="gap-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Finances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg bg-primary/10 p-4 text-center">
                <p className="text-xs text-muted-foreground">Loyer mensuel</p>
                <p className="mt-1 text-2xl font-bold text-primary">{formatMontant(bien.prixLocation)}</p>
              </div>
              {contratActif && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Contrat actif</p>
                  <Link href={`/contrats/${contratActif.id}`} className="mt-1 text-sm font-medium text-primary hover:underline">
                    {contratActif.reference}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(contratActif.dateDebut)} - {formatDate(contratActif.dateFin)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contrats History */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historique des contrats</CardTitle>
          <CardDescription>{contratsBien.length} contrat(s) pour ce bien</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden sm:table-cell">Debut</TableHead>
                <TableHead className="hidden sm:table-cell">Fin</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratsBien.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Aucun contrat pour ce bien
                  </TableCell>
                </TableRow>
              ) : (
                contratsBien.map((ct) => {
                  const client = getClient(ct.clientId)
                  return (
                    <TableRow key={ct.id}>
                      <TableCell>
                        <Link href={`/contrats/${ct.id}`} className="font-medium text-primary hover:underline">
                          {ct.reference}
                        </Link>
                      </TableCell>
                      <TableCell>{client ? `${client.prenom} ${client.nom}` : "-"}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(ct.dateDebut)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(ct.dateFin)}</TableCell>
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
            <DialogTitle>Modifier le bien</DialogTitle>
            <DialogDescription>Modifiez les informations du bien immobilier.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nom">Nom *</Label>
              <Input id="edit-nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Residence Harmonie A4" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TypeBien })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Appartement">Appartement</SelectItem>
                    <SelectItem value="Maison">Maison</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Studio">Studio</SelectItem>
                    <SelectItem value="Local commercial">Local commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-prixLocation">Loyer mensuel (GNF) *</Label>
                <Input id="edit-prixLocation" type="number" value={form.prixLocation} onChange={(e) => setForm({ ...form, prixLocation: e.target.value })} placeholder="250000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-adresse">Adresse *</Label>
                <Input id="edit-adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="12 Rue des Jardins" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-ville">Ville *</Label>
                <Input id="edit-ville" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} placeholder="Abidjan" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-superficie">Superficie (m2)</Label>
                <Input id="edit-superficie" type="number" value={form.superficie} onChange={(e) => setForm({ ...form, superficie: e.target.value })} placeholder="85" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-nbPieces">Nb pieces</Label>
                <Input id="edit-nbPieces" type="number" value={form.nbPieces} onChange={(e) => setForm({ ...form, nbPieces: e.target.value })} placeholder="3" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description du bien..." rows={3} />
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
