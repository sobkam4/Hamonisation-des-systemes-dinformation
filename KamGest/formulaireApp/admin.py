from io import BytesIO

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.http import HttpResponse
from openpyxl import Workbook
from utils import generate_activity_logs_pdf

from .models import ActivityLog, Category, Customer, Delivery, Order, OrderItem, Product, StockMovement


admin.site.unregister(User)


def build_excel_response(filename, sheet_name, headers, rows):
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = sheet_name
    worksheet.append(headers)

    for row in rows:
        worksheet.append(row)

    output = BytesIO()
    workbook.save(output)
    output.seek(0)

    response = HttpResponse(
        output.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_superuser",
        "is_active",
        "date_joined",
        "last_login",
    )
    list_filter = ("is_staff", "is_superuser", "is_active", "groups", "date_joined")
    search_fields = ("username", "first_name", "last_name", "email")
    ordering = ("-date_joined",)
    list_per_page = 25
    actions = (
        "activate_users",
        "deactivate_users",
        "grant_staff_access",
        "revoke_staff_access",
        "export_users_to_excel",
    )

    @admin.action(description="Activer les utilisateurs selectionnes")
    def activate_users(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Desactiver les utilisateurs selectionnes")
    def deactivate_users(self, request, queryset):
        queryset.update(is_active=False)

    @admin.action(description="Donner les droits staff aux utilisateurs selectionnes")
    def grant_staff_access(self, request, queryset):
        queryset.update(is_staff=True)

    @admin.action(description="Retirer les droits staff aux utilisateurs selectionnes")
    def revoke_staff_access(self, request, queryset):
        queryset.update(is_staff=False)

    @admin.action(description="Exporter les utilisateurs selectionnes en Excel")
    def export_users_to_excel(self, request, queryset):
        headers = [
            "ID",
            "Username",
            "Email",
            "Prenom",
            "Nom",
            "Actif",
            "Staff",
            "Superuser",
            "Date inscription",
            "Derniere connexion",
        ]
        rows = [
            [
                user.id,
                user.username,
                user.email,
                user.first_name,
                user.last_name,
                user.is_active,
                user.is_staff,
                user.is_superuser,
                user.date_joined.isoformat() if user.date_joined else "",
                user.last_login.isoformat() if user.last_login else "",
            ]
            for user in queryset
        ]
        return build_excel_response("utilisateurs.xlsx", "Utilisateurs", headers, rows)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name", "slug")
    readonly_fields = ("slug", "created_at")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "reference",
        "name",
        "category",
        "sale_price",
        "stock_quantity",
        "low_stock_threshold",
        "is_active",
        "updated_at",
    )
    list_filter = ("is_active", "category")
    search_fields = ("reference", "name")
    list_per_page = 25


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "phone", "email", "city", "updated_at")
    search_fields = ("first_name", "last_name", "phone", "email", "city")
    list_per_page = 25


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    autocomplete_fields = ("product",)
    readonly_fields = ("subtotal",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("number", "customer", "seller", "status", "total", "payment_method", "created_at")
    list_filter = ("status", "payment_method", "created_at")
    search_fields = ("number", "customer__first_name", "customer__last_name", "seller__username")
    readonly_fields = ("number", "subtotal", "total", "confirmed_at", "invoice_object_name", "invoice_uploaded_at")
    autocomplete_fields = ("customer", "seller")
    inlines = [OrderItemInline]


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ("order", "status", "address", "scheduled_for", "delivered_at")
    list_filter = ("status",)
    search_fields = ("order__number", "address")
    autocomplete_fields = ("order",)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ("product", "movement_type", "quantity", "order", "created_by", "created_at")
    list_filter = ("movement_type", "created_at")
    search_fields = ("product__reference", "product__name", "order__number")
    autocomplete_fields = ("product", "order", "created_by")
    readonly_fields = ("created_at",)


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "action", "user", "entity_type", "entity_id", "description")
    list_filter = ("action", "entity_type", "created_at")
    search_fields = ("description", "entity_type", "entity_id", "user__username")
    readonly_fields = ("created_at", "action", "user", "entity_type", "entity_id", "description", "metadata")
    ordering = ("-created_at",)
    actions = ("export_activity_logs_to_pdf",)

    @admin.action(description="Exporter les logs selectionnes en PDF")
    def export_activity_logs_to_pdf(self, request, queryset):
        logs = queryset.select_related("user").order_by("-created_at")
        buffer = generate_activity_logs_pdf(logs)
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="journal-activites.pdf"'
        return response
