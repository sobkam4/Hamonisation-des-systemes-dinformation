from rest_framework import permissions


class IsVerifiedRescuer(permissions.BasePermission):
    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if u.is_superuser:
            return True
        return bool(
            getattr(u, "is_verified_rescuer", False)
            and u.role in (u.Role.RESCUER, u.Role.ADMIN)
        )


class IsEnterpriseAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(
            u and u.is_authenticated and u.role == u.Role.ENTERPRISE_ADMIN
        ) or (u and u.is_staff)
