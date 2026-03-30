export function formatMontant(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "GNF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant)
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatDateLong(dateStr: string): string {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)
}

export function formatMois(dateStr: string): string {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "2-digit",
  }).format(date)
}

export function getInitiales(nom: string, prenom?: string): string {
  // Si un seul argument est fourni (nom complet), le diviser
  if (!prenom && nom) {
    const parts = nom.trim().split(/\s+/)
    if (parts.length >= 2) {
      // Prendre le premier mot comme prénom et le dernier comme nom
      const prenomPart = parts[0]
      const nomPart = parts[parts.length - 1]
      return `${prenomPart.charAt(0)}${nomPart.charAt(0)}`.toUpperCase()
    } else if (parts.length === 1) {
      // Si un seul mot, prendre les deux premières lettres
      const word = parts[0]
      return word.length >= 2 ? word.substring(0, 2).toUpperCase() : word.charAt(0).toUpperCase()
    }
    return ""
  }
  
  // Si deux arguments sont fournis (nom et prénom séparés)
  if (nom && prenom) {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
  }
  
  // Cas par défaut
  return nom ? nom.charAt(0).toUpperCase() : ""
}
