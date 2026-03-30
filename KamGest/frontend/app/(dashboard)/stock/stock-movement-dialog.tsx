'use client'

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
import type { Article } from '@/lib/types'

const movementSchema = z.object({
  article: z.string().min(1, "L'article est requis"),
  type_mouvement: z.string().min(1, 'Le type est requis'),
  quantite: z.coerce.number().min(1, 'La quantite doit etre au moins 1'),
  notes: z.string().optional(),
})

type MovementFormData = z.infer<typeof movementSchema>

interface StockMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articles: Article[]
  onSave: (data: {
    article: number
    type_mouvement: string
    quantite: number
    notes?: string
  }) => void | Promise<void>
}

export function StockMovementDialog({
  open,
  onOpenChange,
  articles,
  onSave,
}: StockMovementDialogProps) {
  const form = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      article: '',
      type_mouvement: '',
      quantite: 1,
      notes: '',
    },
  })

  const onSubmit = (data: MovementFormData) => {
    onSave({
      article: parseInt(data.article),
      type_mouvement: data.type_mouvement,
      quantite: data.quantite,
      notes: data.notes,
    })
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Nouveau mouvement de stock</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="article"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Article</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectionner un article" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {articles.map((article) => (
                        <SelectItem key={article.id} value={article.id.toString()}>
                          {article.nom} ({article.reference})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type_mouvement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de mouvement</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectionner le type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entree">Entree (reception)</SelectItem>
                      <SelectItem value="sortie">Sortie (vente)</SelectItem>
                      <SelectItem value="ajustement">Ajustement (inventaire)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantite</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Raison du mouvement..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
