
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from formulaireApp.views import (
    ActivityLogExportView,
    CurrentUserView,
    CategoryViewSet,
    CustomerExportView,
    CustomerImportView,
    CustomerTemplateCsvView,
    CustomerTemplateExcelView,
    CustomerViewSet,
    DashboardStatsView,
    DeliveryViewSet,
    InvoiceExcelExportView,
    InvoicePdfZipExportView,
    LoginView,
    LogoutView,
    ActivityLogViewSet,
    OrderExportView,
    OrderInvoiceDownloadView,
    OrderViewSet,
    ProductExportView,
    ProductImportView,
    ProductTemplateCsvView,
    ProductTemplateExcelView,
    ProductViewSet,
    StockMovementViewSet,
    UserViewSet,
    UserExportView,
    UserImportView,
    UserTemplateCsvView,
    UserTemplateExcelView,
)

router = DefaultRouter()
router.register(r"activity-logs", ActivityLogViewSet, basename="activity-log")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"deliveries", DeliveryViewSet, basename="delivery")
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"stock-movements", StockMovementViewSet, basename="stock-movement")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("api/exports/customers/", CustomerExportView.as_view(), name="export-customers"),
    path("api/exports/orders/", OrderExportView.as_view(), name="export-orders"),
    path("api/exports/products/", ProductExportView.as_view(), name="export-products"),
    path("api/exports/users/", UserExportView.as_view(), name="export-users"),
    path("api/exports/activity-logs/", ActivityLogExportView.as_view(), name="export-activity-logs"),
    path("api/exports/invoices/excel/", InvoiceExcelExportView.as_view(), name="export-invoices-excel"),
    path("api/exports/invoices/pdf-zip/", InvoicePdfZipExportView.as_view(), name="export-invoices-pdf-zip"),
    path("api/templates/products/excel/", ProductTemplateExcelView.as_view(), name="template-products-excel"),
    path("api/templates/products/csv/", ProductTemplateCsvView.as_view(), name="template-products-csv"),
    path("api/templates/customers/excel/", CustomerTemplateExcelView.as_view(), name="template-customers-excel"),
    path("api/templates/customers/csv/", CustomerTemplateCsvView.as_view(), name="template-customers-csv"),
    path("api/templates/users/excel/", UserTemplateExcelView.as_view(), name="template-users-excel"),
    path("api/templates/users/csv/", UserTemplateCsvView.as_view(), name="template-users-csv"),
    path("api/imports/products/", ProductImportView.as_view(), name="import-products"),
    path("api/imports/customers/", CustomerImportView.as_view(), name="import-customers"),
    path("api/imports/users/", UserImportView.as_view(), name="import-users"),
    path("api/", include(router.urls)),
    path("api/auth/login/", LoginView.as_view(), name="auth-login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("api/auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("api/auth/me/", CurrentUserView.as_view(), name="auth-me"),
    path("api/orders/<int:pk>/invoice/", OrderInvoiceDownloadView.as_view(), name="order-invoice"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)