"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Building2, Home, Store, BedDouble, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import { PageHeader } from "@/components/page-header"
import { useApiData } from "@/lib/api-context"
import { formatMontant } from "@/lib/format"
import type { TypeBien, StatutBien } from "@/lib/types"
import { toast } from "sonner"
import { usePermissions } from "@/lib/permissions"

const typeIcons: Record<string, React.ElementType> = {
  Appartement: Building2,
  Maison: Home,
  "Local commercial": Store,
  Studio: BedDouble,
  Villa: Home,
}

export default function BiensPage() {
  const { biens, loading, loadBiens, createBien, deleteBien } = useApiData()
  const { canEdit, canDelete } = usePermissions()
  const [search, setSearch] = useState("")
  const [filterStatut, setFilterStatut] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    loadBiens()
  }, [loadBiens])

  // Form state
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

  const filtered = useMemo(() => {
    return biens.filter((b) => {
      const matchSearch =
        b.nom.toLowerCase().includes(search.toLowerCase()) ||
        b.adresse.toLowerCase().includes(search.toLowerCase()) ||
        b.ville.toLowerCase().includes(search.toLowerCase())
      const matchStatut = filterStatut === "all" || b.statut === filterStatut
      const matchType = filterType === "all" || b.type === filterType
      return matchSearch && matchStatut && matchType
    })
  }, [biens, search, filterStatut, filterType])

  const handleDeleteBien = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) {
      return
    }
    const success = await deleteBien(id)
    if (!success) {
      toast.error("Erreur lors de la suppression du bien")
    }
  }

  const handleSubmit = async () => {
    if (!form.nom || !form.adresse || !form.prixLocation) {
      toast.error("Veuillez remplir tous les champs obligatoires.")
      return
    }

    // Construire l'adresse complète avec la ville si fournie
    const adresseComplete = form.ville 
      ? `${form.adresse}, ${form.ville}`
      : form.adresse

    const newBien = {
      nom: form.nom,
      type_bien: form.type,
      adresse: adresseComplete,
      superficie: Number(form.superficie) || 0,
      nombre_pieces: Number(form.nbPieces) || 1,
      prix_location: Number(form.prixLocation),
      statut: "disponible",
      description: form.description || "",
    }

    const created = await createBien(newBien)
    if (created) {
      setDialogOpen(false)
      setForm({ nom: "", type: "Appartement", adresse: "", ville: "", superficie: "", nbPieces: "", prixLocation: "", description: "" })
    }
  }

  if (loading.biens && biens.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Chargement des biens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Gestion des Biens" description={`${biens.length} biens dans votre parc immobilier`}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" /> Ajouter un bien
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau bien</DialogTitle>
              <DialogDescription>Ajoutez un nouveau bien a votre parc immobilier.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Residence Harmonie A4" />
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
                  <Label htmlFor="prixLocation">Loyer mensuel (GNF) *</Label>
                  <Input id="prixLocation" type="number" value={form.prixLocation} onChange={(e) => setForm({ ...form, prixLocation: e.target.value })} placeholder="250000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="adresse">Adresse *</Label>
                  <Input id="adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="12 Rue des Jardins" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ville">Ville *</Label>
                  <Input id="ville" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} placeholder="Abidjan" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="superficie">Superficie (m2)</Label>
                  <Input id="superficie" type="number" value={form.superficie} onChange={(e) => setForm({ ...form, superficie: e.target.value })} placeholder="85" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nbPieces">Nb pieces</Label>
                  <Input id="nbPieces" type="number" value={form.nbPieces} onChange={(e) => setForm({ ...form, nbPieces: e.target.value })} placeholder="3" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description du bien..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmit}>Ajouter</Button>
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
              <Input placeholder="Rechercher par nom, adresse..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Disponible">Disponible</SelectItem>
                <SelectItem value="Loué">Loue</SelectItem>
                <SelectItem value="En maintenance">En maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="Appartement">Appartement</SelectItem>
                <SelectItem value="Maison">Maison</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Studio">Studio</SelectItem>
                <SelectItem value="Local commercial">Local commercial</SelectItem>
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
                <TableHead>Bien</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden sm:table-cell">Adresse</TableHead>
                <TableHead>Loyer</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[130px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Aucun bien trouve
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((bien) => {
                  const Icon = typeIcons[bien.type] || Building2
                  return (
                    <TableRow key={bien.id} className="hover:bg-accent/50">
                      <TableCell>
                        <Link href={`/biens/${bien.id}`} className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="size-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{bien.nom}</span>
                            <span className="text-xs text-muted-foreground md:hidden">{bien.type}</span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{bien.type}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm">{bien.adresse}, {bien.ville}</span>
                      </TableCell>
                      <TableCell className="font-medium">{formatMontant(bien.prixLocation)}</TableCell>
                      <TableCell><StatusBadge status={bien.statut} /></TableCell>
                      <TableCell className="space-x-2 text-right">
                        {canEdit(bien as any) && (
                          <Button variant="outline" size="icon" asChild>
                            <Link href={`/biens/${bien.id}`}>
                              <Pencil className="size-3.5" />
                            </Link>
                          </Button>
                        )}
                        {canDelete(bien as any) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBien(bien.id)}
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
