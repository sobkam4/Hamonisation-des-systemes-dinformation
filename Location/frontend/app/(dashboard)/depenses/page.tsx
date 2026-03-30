"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { Plus, Search, Upload, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"
import { useApiData } from "@/lib/api-context"
import { apiClient, API_ENDPOINTS } from "@/lib/api"
import { formatMontant, formatDate } from "@/lib/format"
import { toast } from "sonner"
import { usePermissions } from "@/lib/permissions"
import type { CategorieDepense } from "@/lib/types"

export default function DepensesPage() {
  const { depenses, biens, loading, loadDepenses, loadBiens, createDepense, updateDepense, deleteDepense, getBien } = useApiData()
  const { canEdit, canDelete } = usePermissions()
  const [search, setSearch] = useState("")
  const [filterCategorie, setFilterCategorie] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingDepense, setEditingDepense] = useState<any>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDepenses()
    loadBiens()
  }, [loadDepenses, loadBiens])

  // Recharger les biens quand le dialog s'ouvre pour avoir les biens récemment créés
  useEffect(() => {
    if (dialogOpen) {
      loadBiens()
    }
  }, [dialogOpen, loadBiens])

  const [form, setForm] = useState({
    bienId: "",
    categorie: "Maintenance" as CategorieDepense,
    description: "",
    montant: "",
    date: "",
    fournisseur: "",
  })

  const depensesEnrichies = useMemo(() => {
    return depenses.map((d: any) => ({
      ...d,
      bien: (d.bien || d.bienId) ? getBien(d.bien || d.bienId) : undefined,
    }))
  }, [depenses, getBien])

  const filtered = useMemo(() => {
    return depensesEnrichies.filter((d) => {
      const matchSearch =
        d.description.toLowerCase().includes(search.toLowerCase()) ||
        d.fournisseur?.toLowerCase().includes(search.toLowerCase()) ||
        d.bien?.nom.toLowerCase().includes(search.toLowerCase())
      const matchCategorie = filterCategorie === "all" || d.categorie === filterCategorie
      return matchSearch && matchCategorie
    })
  }, [depensesEnrichies, search, filterCategorie])

  const resetForm = () => {
    setForm({
      bienId: "",
      categorie: "Maintenance",
      description: "",
      montant: "",
      date: "",
      fournisseur: "",
    })
  }

  const handleSubmit = async () => {
    if (!form.description || !form.montant || !form.date || !form.categorie) {
      toast.error("Veuillez remplir tous les champs obligatoires.")
      return
    }

    const depenseData = {
      bien: form.bienId ? Number(form.bienId) : null,
      categorie: form.categorie,
      description: form.description,
      montant: Number(form.montant),
      date: form.date,
      fournisseur: form.fournisseur || undefined,
    }

    if (editingDepense) {
      const updated = await updateDepense(editingDepense.id, depenseData)
      if (updated) {
        setEditDialogOpen(false)
        setEditingDepense(null)
        resetForm()
      }
    } else {
      const created = await createDepense(depenseData)
      if (created) {
        setDialogOpen(false)
        resetForm()
      }
    }
  }

  const handleEditClick = (depense: any) => {
    setEditingDepense(depense)
    setForm({
      bienId: depense.bienId || "",
      categorie: depense.categorie || "Maintenance",
      description: depense.description || "",
      montant: String(depense.montant || ""),
      date: depense.date || "",
      fournisseur: depense.fournisseur || "",
    })
    setEditDialogOpen(true)
  }

  const handleDelete = async (depense: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la dépense "${depense.description}" ?`)) {
      return
    }

    const deleted = await deleteDepense(depense.id)
    if (deleted) {
      toast.success("Dépense supprimée avec succès")
    }
  }

  const totalDepenses = useMemo(() => {
    return filtered.reduce((sum, d) => sum + d.montant, 0)
  }, [filtered])

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedExtensions = ['.csv', '.xlsx', '.xls']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast.error('Format de fichier non supporté. Utilisez CSV, XLSX ou XLS')
      return
    }

    setImporting(true)
    try {
      const response = await apiClient.upload(API_ENDPOINTS.DEPENSES.IMPORT, file)
      toast.success(response.data.message || `${response.data.depenses_importees?.length || 0} dépenses importées`)
      
      if (response.data.erreurs && response.data.erreurs.length > 0) {
        console.warn('Erreurs lors de l\'import:', response.data.erreurs)
        toast.warning(`${response.data.erreurs.length} erreur(s) lors de l'import`)
      }
      
      await loadDepenses()
      setImportDialogOpen(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Erreur lors de l\'importation')
    } finally {
      setImporting(false)
    }
  }

  if (loading.depenses && depenses.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Chargement des dépenses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Gestion des Depenses" description={`${depenses.length} depenses enregistrees`}>
        <div className="flex gap-2">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Upload className="mr-2 size-4" /> Importer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importer des dépenses</DialogTitle>
                <DialogDescription>
                  Importez un fichier Excel (.xlsx, .xls) ou CSV contenant vos dépenses.
                  <br />
                  <br />
                  <strong>Format attendu :</strong>
                  <br />
                  Colonnes : date, categorie, description, montant, type_depense, fournisseur, numero_facture, bien_id (optionnel)
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="file-import">Fichier Excel ou CSV</Label>
                  <Input
                    id="file-import"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    ref={fileInputRef}
                    onChange={handleImport}
                    disabled={importing}
                  />
                  <p className="text-sm text-muted-foreground">
                    Formats supportés : CSV, XLSX, XLS
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 size-4" /> Nouvelle depense</Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvelle depense</DialogTitle>
              <DialogDescription>Enregistrez une nouvelle depense.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Bien (optionnel)</Label>
                <Select value={form.bienId || "none"} onValueChange={(v) => setForm({ ...form, bienId: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Depense generale" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Depense generale</SelectItem>
                    {biens.map((b: any) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Categorie *</Label>
                <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v as CategorieDepense })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Taxes">Taxes</SelectItem>
                    <SelectItem value="Assurance">Assurance</SelectItem>
                    <SelectItem value="Travaux">Travaux</SelectItem>
                    <SelectItem value="Charges">Charges</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description de la depense" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="montant">Montant (GNF) *</Label>
                  <Input id="montant" type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fournisseur">Fournisseur</Label>
                <Input id="fournisseur" value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} placeholder="Nom du fournisseur (optionnel)" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmit}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setEditingDepense(null)
            resetForm()
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier la depense</DialogTitle>
              <DialogDescription>Modifiez les informations de la depense.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Bien (optionnel)</Label>
                <Select value={form.bienId || "none"} onValueChange={(v) => setForm({ ...form, bienId: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Depense generale" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Depense generale</SelectItem>
                    {biens.map((b: any) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Categorie *</Label>
                <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v as CategorieDepense })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Taxes">Taxes</SelectItem>
                    <SelectItem value="Assurance">Assurance</SelectItem>
                    <SelectItem value="Travaux">Travaux</SelectItem>
                    <SelectItem value="Charges">Charges</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Input id="edit-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description de la depense" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-montant">Montant (GNF) *</Label>
                  <Input id="edit-montant" type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input id="edit-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-fournisseur">Fournisseur</Label>
                <Input id="edit-fournisseur" value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} placeholder="Nom du fournisseur (optionnel)" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditDialogOpen(false)
                setEditingDepense(null)
                resetForm()
              }}>Annuler</Button>
              <Button onClick={handleSubmit}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </PageHeader>

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total depenses</div>
            <div className="text-2xl font-bold">{formatMontant(totalDepenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Nombre de depenses</div>
            <div className="text-2xl font-bold">{filtered.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Moyenne par depense</div>
            <div className="text-2xl font-bold">
              {filtered.length > 0 ? formatMontant(totalDepenses / filtered.length) : formatMontant(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="gap-0">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher par description, fournisseur, bien..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterCategorie} onValueChange={setFilterCategorie}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Categorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les categories</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Taxes">Taxes</SelectItem>
                <SelectItem value="Assurance">Assurance</SelectItem>
                <SelectItem value="Travaux">Travaux</SelectItem>
                <SelectItem value="Charges">Charges</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
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
                <TableHead>Date</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">Bien</TableHead>
                <TableHead className="hidden sm:table-cell">Fournisseur</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Aucune depense trouvee
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d: any) => (
                  <TableRow key={d.id} className="hover:bg-accent/50">
                    <TableCell>{formatDate(d.date)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                        {d.categorie}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{d.description}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {d.bien ? (
                        <Link href={`/biens/${d.bien.id}`} className="hover:underline">{(d.bien as any).nom}</Link>
                      ) : (
                        <span className="text-muted-foreground">Générale</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{d.fournisseur || "-"}</TableCell>
                    <TableCell className="text-right font-medium">{formatMontant(d.montant || 0)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit(d) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(d)}
                            className="h-8 w-8"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        {canDelete(d) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(d)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
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
    </div>
  )
}
