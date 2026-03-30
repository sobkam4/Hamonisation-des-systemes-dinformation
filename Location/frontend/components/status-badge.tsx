import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type StatusVariant = "success" | "warning" | "destructive" | "default" | "secondary"

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusMap: Record<string, StatusVariant> = {
  // Biens
  "Disponible": "success",
  "Loué": "default",
  "En maintenance": "warning",
  // Contrats
  "Actif": "success",
  "Terminé": "secondary",
  "Résilié": "destructive",
  // Paiements
  "Payé": "success",
  "En attente": "warning",
  "Partiel": "warning",
  "En retard": "destructive",
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-success/15 text-success border-success/25 hover:bg-success/20",
  warning: "bg-warning/15 text-warning-foreground border-warning/25 hover:bg-warning/20",
  destructive: "bg-destructive/15 text-destructive-foreground border-destructive/25 hover:bg-destructive/20",
  default: "bg-primary/15 text-primary border-primary/25 hover:bg-primary/20",
  secondary: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusMap[status] || "secondary"

  return (
    <Badge variant="outline" className={cn("font-medium", variantStyles[variant], className)}>
      {status}
    </Badge>
  )
}
