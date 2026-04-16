'use client'

import { useEffect, useMemo } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { Article, Category } from '@/lib/types'

function buildProductSchema(editing: boolean) {
  return z.object({
    reference: editing
      ? z.string().min(1, 'La reference est requise')
      : z.string().optional().or(z.literal('')),
    nom: z.string().min(1, 'Le nom est requis'),
    description: z.string().optional(),
    prix_unitaire: z.string().min(1, 'Le prix est requis'),
    quantite_stock: z.coerce.number().min(0, 'La quantite doit etre positive'),
    seuil_alerte: z.coerce.number().min(1, 'Le seuil doit etre au moins 1'),
    categorie: z.string().optional(),
  })
}

type ProductFormData = z.infer<ReturnType<typeof buildProductSchema>>

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: Article | null
  categories: Category[]
  onSave: (data: Partial<Article>) => void | Promise<void>
}

export function ProductDialog({
  open,
  onOpenChange,
  article,
  categories,
  onSave,
}: ProductDialogProps) {
  const isEdit = !!article
  const schema = useMemo(() => buildProductSchema(isEdit), [isEdit])

  const form = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      reference: '',
      nom: '',
      description: '',
      prix_unitaire: '',
      quantite_stock: 0,
      seuil_alerte: 10,
      categorie: '',
    },
  })

  useEffect(() => {
    if (article) {
      form.reset({
        reference: article.reference,
        nom: article.nom,
        description: article.description || '',
        prix_unitaire: article.prix_unitaire,
        quantite_stock: article.quantite_stock,
        seuil_alerte: article.seuil_alerte,
        categorie: article.categorie?.toString() || '',
      })
    } else {
      form.reset({
        reference: '',
        nom: '',
        description: '',
        prix_unitaire: '',
        quantite_stock: 0,
        seuil_alerte: 10,
        categorie: '',
      })
    }
  }, [article, form])

  const onSubmit = (data: ProductFormData) => {
    const payload: Partial<Article> = {
      nom: data.nom,
      description: data.description,
      prix_unitaire: data.prix_unitaire,
      quantite_stock: data.quantite_stock,
      seuil_alerte: data.seuil_alerte,
      categorie: data.categorie ? parseInt(data.categorie, 10) : null,
    }
    if (article) {
      payload.reference = data.reference
    } else if (data.reference?.trim()) {
      payload.reference = data.reference.trim()
    }
    onSave(payload)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" key={article?.id ?? 'new'}>
        <DialogHeader>
          <DialogTitle>
            {article ? 'Modifier le produit' : 'Nouveau produit'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {article ? (
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="ART-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="flex flex-col justify-end pb-2">
                  <p className="text-sm text-muted-foreground">
                    La reference sera generee automatiquement.
                  </p>
                </div>
              )}
              <FormField
                control={form.control}
                name="categorie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorie</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du produit</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom du produit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description du produit..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prix_unitaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix unitaire (GNF)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantite_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantite en stock</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seuil_alerte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seuil d&apos;alerte</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {article ? 'Enregistrer' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
