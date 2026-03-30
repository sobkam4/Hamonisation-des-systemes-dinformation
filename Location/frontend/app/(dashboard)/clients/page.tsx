"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Mail, Phone, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageHeader } from "@/components/page-header"
import { useApiData } from "@/lib/api-context"
import { getInitiales } from "@/lib/format"
import { toast } from "sonner"
import { usePermissions } from "@/lib/permissions"

export default function ClientsPage() {
  const { clients, contrats, paiements, loading, loadClients, loadContrats, loadPaiements, createClient, deleteClient } = useApiData()
  const { canEdit, canDelete } = usePermissions()
  
  useEffect(() => {
    loadClients()
    loadContrats()
    loadPaiements()
  }, [loadClients, loadContrats, loadPaiements])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", telephone: "", adresse: "", cin: "",
  })

  const clientsEnrichis = useMemo(() => {
    return clients.map((client) => {
      const clientContrats = contrats.filter((c) => c.clientId === client.id)
      const contratIds = clientContrats.map((c) => c.id)
      const clientPaiements = paiements.filter((p) => contratIds.includes(p.contratId))
      const hasRetard = clientPaiements.some((p) => p.statut === "En retard")
      return { ...client, nbContrats: clientContrats.length, hasRetard }
    })
  }, [clients, contrats, paiements])

  const filtered = useMemo(() => {
    return clientsEnrichis.filter((c) =>
      `${c.prenom} ${c.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.telephone.includes(search)
    )
  }, [clientsEnrichis, search])

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      return
    }
    const ok = await deleteClient(id)
    if (!ok) {
      toast.error("Erreur lors de la suppression du client")
    }
  }

  const handleSubmit = async () => {
    if (!form.nom || !form.prenom || !form.email || !form.telephone) {
      toast.error("Veuillez remplir tous les champs obligatoires.")
      return
    }

    const newClient = {
      nom: form.nom,
      prenom: form.prenom,
      email: form.email,
      telephone: form.telephone,
      adresse: form.adresse,
      piece_identite: "CIN",
      numero_piece_identite: form.cin,
    }

    const created = await createClient(newClient)
    if (created) {
      setDialogOpen(false)
      setForm({ nom: "", prenom: "", email: "", telephone: "", adresse: "", cin: "" })
    }
  }
  
  if (loading.clients && clients.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Chargement des clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Gestion des Clients" description={`${clients.length} clients enregistres`}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 size-4" /> Ajouter un client</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau client</DialogTitle>
              <DialogDescription>Ajoutez un nouveau locataire ou prospect.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="prenom">Prenom *</Label>
                  <Input id="prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} placeholder="Sekou" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ouattara" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="sekou@mail.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telephone">Telephone *</Label>
                  <Input id="telephone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+225 07 12 34 56" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input id="adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Abidjan, Cocody" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cin">CIN</Label>
                  <Input id="cin" value={form.cin} onChange={(e) => setForm({ ...form, cin: e.target.value })} placeholder="CI0012345678" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmit}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Search */}
      <Card className="gap-0">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher par nom, email ou telephone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="gap-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden sm:table-cell">Adresse</TableHead>
                <TableHead>Contrats</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[130px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Aucun client trouve
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((client) => (
                  <TableRow key={client.id} className="hover:bg-accent/50">
                    <TableCell>
                      <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-primary/15 text-primary text-xs">
                            {getInitiales(client.nom, client.prenom)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{client.prenom} {client.nom}</span>
                          <span className="text-xs text-muted-foreground md:hidden">{client.email}</span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 text-sm"><Mail className="size-3 text-muted-foreground" /> {client.email}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="size-3" /> {client.telephone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{client.adresse}</TableCell>
                    <TableCell className="text-sm">{client.nbContrats}</TableCell>
                    <TableCell>
                      {client.hasRetard ? (
                        <span className="text-xs font-medium text-destructive-foreground">Retard paiement</span>
                      ) : (
                        <span className="text-xs font-medium text-success">A jour</span>
                      )}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      {canEdit(client as any) && (
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/clients/${client.id}`}>
                            <Pencil className="size-3.5" />
                          </Link>
                        </Button>
                      )}
                      {canDelete(client as any) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      )}
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
