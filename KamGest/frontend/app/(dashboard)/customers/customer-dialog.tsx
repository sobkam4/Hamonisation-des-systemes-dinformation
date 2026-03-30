'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { Client, ClientFormData } from '@/lib/types'

const customerSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
})

type CustomerFormFields = z.infer<typeof customerSchema>

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onSave: (data: ClientFormData) => void | Promise<void>
}

export function CustomerDialog({
  open,
  onOpenChange,
  client,
  onSave,
}: CustomerDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pieceJointe, setPieceJointe] = useState<File | null>(null)

  const form = useForm<CustomerFormFields>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      nom: '',
      email: '',
      telephone: '',
      adresse: '',
    },
  })

  useEffect(() => {
    if (client) {
      form.reset({
        nom: client.nom,
        email: client.email || '',
        telephone: client.telephone || '',
        adresse: client.adresse || '',
      })
    } else {
      form.reset({
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
      })
    }
    setPieceJointe(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [client, form, open])

  const onSubmit = (data: CustomerFormFields) => {
    const payload: ClientFormData = {
      nom: data.nom,
      email: data.email || undefined,
      telephone: data.telephone || undefined,
      adresse: data.adresse || undefined,
    }
    if (!client && pieceJointe) {
      payload.pieceJointe = pieceJointe
    }
    void onSave(payload)
    form.reset()
    setPieceJointe(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Modifier le client' : 'Nouveau client'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet</FormLabel>
                  <FormControl>
                    <Input placeholder="Prenom et nom (ex: Mamadou Diallo)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="client@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telephone</FormLabel>
                  <FormControl>
                    <Input placeholder="+224 6XX XX XX XX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adresse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adresse complete..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!client && (
              <FormItem>
                <FormLabel>Piece jointe (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      setPieceJointe(file ?? null)
                    }}
                    className="cursor-pointer bg-input"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  PDF, image ou document Word.
                </p>
              </FormItem>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {client ? 'Enregistrer' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
