'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Users, Mail, Phone, MapPin, Edit, Trash2, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { DataTable } from '@/components/data-table'
import { CustomerDialog } from './customer-dialog'
import { formatDate } from '@/lib/format'
import type { Client, ClientFormData } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { clientsApi, ApiError } from '@/lib/api'

export default function CustomersPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteClient, setDeleteClient] = useState<Client | null>(null)

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await clientsApi.list()
        setClients(response.results)
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Impossible de charger les clients.'
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadClients()
  }, [])

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const searchLower = search.toLowerCase()
      return (
        client.nom.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.telephone?.toLowerCase().includes(searchLower)
      )
    })
  }, [clients, search])

  const handleSave = async (data: ClientFormData) => {
    try {
      if (editingClient) {
        const updatedClient = await clientsApi.update(editingClient.id, {
          nom: data.nom,
          email: data.email,
          telephone: data.telephone,
          adresse: data.adresse,
        })
        setClients((prev) => prev.map((c) => (c.id === editingClient.id ? updatedClient : c)))
        toast.success('Client mis a jour avec succes')
      } else {
        const createdClient = await clientsApi.create({
          nom: data.nom || '',
          email: data.email,
          telephone: data.telephone,
          adresse: data.adresse,
          pieceJointe: data.pieceJointe,
        })
        setClients((prev) => [createdClient, ...prev])
        toast.success('Client ajoute avec succes')
      }

      setDialogOpen(false)
      setEditingClient(null)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible d enregistrer le client.'
      toast.error(message)
    }
  }

  const handleDelete = async () => {
    if (!deleteClient) return

    try {
      await clientsApi.delete(deleteClient.id)
      setClients((prev) => prev.filter((c) => c.id !== deleteClient.id))
      toast.success('Client supprime avec succes')
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible de supprimer le client.'
      toast.error(message)
    } finally {
      setDeleteClient(null)
    }
  }

  const columns = [
    {
      key: 'nom',
      header: 'Nom',
      render: (client: Client) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{client.nom}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (client: Client) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{client.email || '-'}</span>
        </div>
      ),
    },
    {
      key: 'telephone',
      header: 'Telephone',
      render: (client: Client) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{client.telephone || '-'}</span>
        </div>
      ),
    },
    {
      key: 'adresse',
      header: 'Adresse',
      render: (client: Client) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="max-w-[200px] truncate">{client.adresse || '-'}</span>
        </div>
      ),
    },
    {
      key: 'piece_jointe',
      header: 'PJ',
      className: 'w-[52px]',
      render: (client: Client) =>
        client.piece_jointe_url ? (
          <a
            href={client.piece_jointe_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-primary hover:underline"
            title="Ouvrir la piece jointe"
            onClick={(e) => e.stopPropagation()}
          >
            <Paperclip className="h-4 w-4" />
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'created_at',
      header: 'Date creation',
      render: (client: Client) => formatDate(client.created_at),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[100px]',
      render: (client: Client) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setEditingClient(client)
              setDialogOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Modifier</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteClient(client)
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Supprimer</span>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description="Gestion de la base clients">
        <Button
          onClick={() => {
            setEditingClient(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau client
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par nom, email ou telephone..."
          className="sm:w-96"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredClients}
        keyExtractor={(client) => client.id}
        isLoading={isLoading}
        emptyMessage="Aucun client trouve"
      />

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editingClient}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer le client &quot;{deleteClient?.nom}&quot; ?
              Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
