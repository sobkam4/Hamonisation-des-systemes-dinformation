import { useApiData } from "./api-context"

export interface PermissionHelpers {
  isAdmin: boolean
  canEdit: (item: { created_by?: string | number | { id: string | number } }) => boolean
  canDelete: (item: { created_by?: string | number | { id: string | number } }) => boolean
}

export function usePermissions(): PermissionHelpers {
  const { utilisateurActuel } = useApiData()
  
  const isAdmin = utilisateurActuel?.role === 'Administrateur' || 
                  utilisateurActuel?.role === 'admin'
  
  const getUserId = () => {
    return utilisateurActuel?.id
  }
  
  const getItemCreatorId = (item: { created_by?: string | number | { id: string | number } }): string | number | null => {
    if (!item.created_by) return null
    if (typeof item.created_by === 'string' || typeof item.created_by === 'number') {
      return item.created_by
    }
    if (typeof item.created_by === 'object' && item.created_by.id) {
      return item.created_by.id
    }
    return null
  }
  
  const canEdit = (item: { created_by?: string | number | { id: string | number } }): boolean => {
    if (isAdmin) return true
    const userId = getUserId()
    const creatorId = getItemCreatorId(item)
    if (!userId || !creatorId) return false
    return String(userId) === String(creatorId)
  }
  
  const canDelete = (item: { created_by?: string | number | { id: string | number } }): boolean => {
    if (isAdmin) return true
    const userId = getUserId()
    const creatorId = getItemCreatorId(item)
    if (!userId || !creatorId) return false
    return String(userId) === String(creatorId)
  }
  
  return {
    isAdmin,
    canEdit,
    canDelete,
  }
}
