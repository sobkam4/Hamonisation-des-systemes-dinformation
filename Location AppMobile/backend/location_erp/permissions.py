from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission personnalisée: 
    - Les admins peuvent tout faire
    - Les utilisateurs peuvent seulement modifier/supprimer leurs propres éléments
    """
    
    def has_object_permission(self, request, view, obj):
        # Les admins peuvent tout faire
        if request.user.role == 'admin':
            return True
        
        # Vérifier si l'utilisateur est le créateur de l'objet
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        return False
