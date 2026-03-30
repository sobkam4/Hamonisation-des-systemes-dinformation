from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.accounts.models import ICEContact, PhoneOTPChallenge, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("phone",)
    list_display = ("phone", "email", "role", "is_verified_rescuer", "is_staff", "is_active")
    search_fields = ("phone", "email", "display_name")
    list_filter = ("role", "is_verified_rescuer", "is_staff", "is_active")
    filter_horizontal = ("groups", "user_permissions")

    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        ("Profil", {"fields": ("email", "display_name", "preferred_language", "role")}),
        ("Secourisme", {"fields": ("is_verified_rescuer",)}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("phone", "password1", "password2", "is_staff")}),
    )


admin.site.register(ICEContact)
admin.site.register(PhoneOTPChallenge)
