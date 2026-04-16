import json
import zipfile
from io import BytesIO

from django.contrib.auth import authenticate, get_user_model
from django.db.models import Sum
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from utils import generate_activity_logs_pdf, generate_invoice_pdf

from .models import ActivityLog, Category, Customer, Delivery, Order, Product, StockMovement
from .serializer import (
    ActivityLogSerializer,
    AdminUserSerializer,
    CategorySerializer,
    CustomerSerializer,
    DeliverySerializer,
    LoginSerializer,
    OrderSerializer,
    ProductSerializer,
    StockMovementSerializer,
    UserSerializer,
)
from .services import (
    build_csv_response,
    build_excel_response,
    clone_buffer,
    import_customers_from_file,
    import_products_from_file,
    import_users_from_file,
    log_activity,
    upload_order_invoice_to_minio,
)

User = get_user_model()


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Category.objects.all().order_by("name")


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Product.objects.select_related("category").all().order_by("name")
        if self.request.query_params.get("low_stock") == "1":
            queryset = queryset.filter(stock_quantity__lte=5)
        return queryset

    def perform_create(self, serializer):
        product = serializer.save()
        log_activity(
            action="product_created",
            description=f"Article {product.reference} cree.",
            entity_type="product",
            entity_id=product.id,
            user=self.request.user,
            metadata={"stock_quantity": product.stock_quantity, "sale_price": str(product.sale_price)},
        )

    def perform_update(self, serializer):
        product = serializer.save()
        log_activity(
            action="product_updated",
            description=f"Article {product.reference} modifie.",
            entity_type="product",
            entity_id=product.id,
            user=self.request.user,
            metadata={"stock_quantity": product.stock_quantity, "sale_price": str(product.sale_price)},
        )


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    queryset = Customer.objects.all().order_by("last_name", "first_name")

    def perform_create(self, serializer):
        customer = serializer.save()
        log_activity(
            action="customer_created",
            description=f"Client {customer.full_name} cree.",
            entity_type="customer",
            entity_id=customer.id,
            user=self.request.user,
            metadata={"phone": customer.phone, "email": customer.email},
        )

    def perform_update(self, serializer):
        customer = serializer.save()
        log_activity(
            action="customer_updated",
            description=f"Client {customer.full_name} modifie.",
            entity_type="customer",
            entity_id=customer.id,
            user=self.request.user,
            metadata={"phone": customer.phone, "email": customer.email},
        )


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.select_related("customer", "seller")
            .prefetch_related("items__product", "delivery")
            .all()
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        order = serializer.save()
        log_activity(
            action="order_created",
            description=f"Commande {order.number} creee.",
            entity_type="order",
            entity_id=order.id,
            user=self.request.user,
            metadata={"status": order.status, "total": str(order.total)},
        )

    def perform_update(self, serializer):
        order = serializer.save()
        log_activity(
            action="order_updated",
            description=f"Commande {order.number} modifiee.",
            entity_type="order",
            entity_id=order.id,
            user=self.request.user,
            metadata={"status": order.status, "total": str(order.total)},
        )

    def perform_destroy(self, instance):
        if instance.status not in {Order.STATUS_DRAFT, Order.STATUS_CANCELLED}:
            raise permissions.PermissionDenied(
                "Seules les commandes en brouillon ou annulees peuvent etre supprimees."
            )
        order_id = instance.id
        order_number = instance.number
        instance.delete()
        log_activity(
            action="order_deleted",
            description=f"Commande {order_number} supprimee.",
            entity_type="order",
            entity_id=order_id,
            user=self.request.user,
        )


class DeliveryViewSet(viewsets.ModelViewSet):
    serializer_class = DeliverySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Delivery.objects.select_related("order").all().order_by("-created_at")

    def perform_create(self, serializer):
        delivery = serializer.save()
        log_activity(
            action="delivery_updated",
            description=f"Livraison creee pour {delivery.order.number}.",
            entity_type="delivery",
            entity_id=delivery.id,
            user=self.request.user,
            metadata={"status": delivery.status},
        )

    def perform_update(self, serializer):
        delivery = serializer.save()
        log_activity(
            action="delivery_updated",
            description=f"Livraison de {delivery.order.number} mise a jour.",
            entity_type="delivery",
            entity_id=delivery.id,
            user=self.request.user,
            metadata={"status": delivery.status},
        )


class StockMovementViewSet(viewsets.ModelViewSet):
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return (
            StockMovement.objects.select_related("product", "order", "created_by")
            .all()
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        movement = serializer.save()
        log_activity(
            action="stock_adjusted",
            description=f"Mouvement {movement.movement_type} enregistre pour {movement.product.reference}.",
            entity_type="stock_movement",
            entity_id=movement.id,
            user=self.request.user,
            metadata={"product_id": movement.product_id, "quantity": movement.quantity},
        )


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    http_method_names = ["get", "post", "patch", "put", "delete", "head", "options"]

    def get_queryset(self):
        return User.objects.all().order_by("-date_joined", "username")

    def perform_create(self, serializer):
        user = serializer.save()
        log_activity(
            action="user_created",
            description=f"Utilisateur {user.username} cree.",
            entity_type="user",
            entity_id=user.id,
            user=self.request.user,
            metadata={"is_staff": user.is_staff, "is_active": user.is_active},
        )

    def perform_update(self, serializer):
        user = serializer.save()
        log_activity(
            action="user_updated",
            description=f"Utilisateur {user.username} modifie.",
            entity_type="user",
            entity_id=user.id,
            user=self.request.user,
            metadata={"is_staff": user.is_staff, "is_active": user.is_active},
        )

    def perform_destroy(self, instance):
        user_id = instance.id
        username = instance.username
        instance.delete()
        log_activity(
            action="user_updated",
            description=f"Utilisateur {username} supprime.",
            entity_type="user",
            entity_id=user_id,
            user=self.request.user,
            metadata={"deleted": True},
        )


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return ActivityLog.objects.select_related("user").all()


class DashboardStatsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        sales_queryset = Order.objects.filter(status__in=[Order.STATUS_CONFIRMED, Order.STATUS_DELIVERED])
        sales_today = sales_queryset.filter(created_at__date=today)
        recent_orders = sales_queryset.select_related("customer").order_by("-created_at")[:5]

        payload = {
            "products_count": Product.objects.count(),
            "low_stock_count": Product.objects.filter(
                stock_quantity__lte=5,
                is_active=True,
            ).count(),
            "customers_count": Customer.objects.count(),
            "orders_count": Order.objects.count(),
            "revenue_total": str(sales_queryset.aggregate(total=Sum("total"))["total"] or 0),
            "sales_today_total": str(sales_today.aggregate(total=Sum("total"))["total"] or 0),
            "pending_deliveries_count": Delivery.objects.filter(
                status__in=[Delivery.STATUS_PENDING, Delivery.STATUS_IN_TRANSIT]
            ).count(),
            "recent_orders": [
                {
                    "id": order.id,
                    "number": order.number,
                    "customer_name": order.customer.full_name,
                    "status": order.status,
                    "total": str(order.total),
                    "created_at": order.created_at.isoformat(),
                }
                for order in recent_orders
            ],
        }
        return Response(payload, status=status.HTTP_200_OK)


class ProductExportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        products = Product.objects.select_related("category").all().order_by("name")
        headers = [
            "ID",
            "Reference",
            "Nom",
            "Categorie",
            "Prix vente",
            "Stock",
            "Seuil faible",
            "Actif",
            "Cree le",
        ]
        rows = [
            [
                product.id,
                product.reference,
                product.name,
                product.category.name if product.category else "",
                str(product.sale_price),
                product.stock_quantity,
                product.low_stock_threshold,
                product.is_active,
                product.created_at.isoformat() if product.created_at else "",
            ]
            for product in products
        ]
        return build_excel_response("articles.xlsx", "Articles", headers, rows)


class CustomerExportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        customers = Customer.objects.all().order_by("last_name", "first_name")
        headers = ["ID", "Prenom", "Nom", "Telephone", "Email", "Adresse", "Ville", "Notes"]
        rows = [
            [
                customer.id,
                customer.first_name,
                customer.last_name,
                customer.phone,
                customer.email,
                customer.address,
                customer.city,
                customer.notes,
            ]
            for customer in customers
        ]
        return build_excel_response("clients.xlsx", "Clients", headers, rows)


class OrderExportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.select_related("customer", "seller").all().order_by("-created_at")
        headers = [
            "ID",
            "Numero",
            "Client",
            "Vendeur",
            "Statut",
            "Paiement",
            "Devise",
            "Sous total",
            "Total",
            "Adresse livraison",
            "Cree le",
        ]
        rows = [
            [
                order.id,
                order.number,
                order.customer.full_name,
                order.seller.username if order.seller else "",
                order.status,
                order.payment_method,
                order.currency,
                str(order.subtotal),
                str(order.total),
                order.delivery_address,
                order.created_at.isoformat() if order.created_at else "",
            ]
            for order in orders
        ]
        return build_excel_response("commandes.xlsx", "Commandes", headers, rows)


class UserExportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by("-date_joined", "username")
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
            for user in users
        ]
        return build_excel_response("utilisateurs.xlsx", "Utilisateurs", headers, rows)


class ActivityLogExportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        logs = ActivityLog.objects.select_related("user").order_by("-created_at")
        buffer = generate_activity_logs_pdf(logs)
        return HttpResponse(
            buffer.getvalue(),
            content_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="journal-activites.pdf"'},
        )


class ProductTemplateExcelView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        headers = [
            "reference",
            "nom",
            "categorie",
            "description",
            "prix_vente",
            "stock",
            "seuil_stock_faible",
            "actif",
        ]
        rows = [["ART-001", "Ordinateur portable", "Informatique", "16 Go RAM", "6500000", "12", "3", "oui"]]
        return build_excel_response("modele_articles.xlsx", "ModeleArticles", headers, rows)


class ProductTemplateCsvView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        headers = [
            "reference",
            "nom",
            "categorie",
            "description",
            "prix_vente",
            "stock",
            "seuil_stock_faible",
            "actif",
        ]
        rows = [["ART-001", "Ordinateur portable", "Informatique", "16 Go RAM", "6500000", "12", "3", "oui"]]
        return build_csv_response("modele_articles.csv", headers, rows)


class CustomerTemplateExcelView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        headers = ["prenom", "nom", "telephone", "email", "adresse", "ville", "notes"]
        rows = [["Aminata", "Diallo", "622000000", "aminata@example.com", "Matam", "Conakry", "Cliente fidele"]]
        return build_excel_response("modele_clients.xlsx", "ModeleClients", headers, rows)


class CustomerTemplateCsvView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        headers = ["prenom", "nom", "telephone", "email", "adresse", "ville", "notes"]
        rows = [["Aminata", "Diallo", "622000000", "aminata@example.com", "Matam", "Conakry", "Cliente fidele"]]
        return build_csv_response("modele_clients.csv", headers, rows)


class UserTemplateExcelView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        headers = ["username", "email", "prenom", "nom", "actif", "staff", "password"]
        rows = [["awa.bah", "awa@example.com", "Awa", "Bah", "oui", "non", "secret12345"]]
        return build_excel_response("modele_utilisateurs.xlsx", "ModeleUtilisateurs", headers, rows)


class UserTemplateCsvView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        headers = ["username", "email", "prenom", "nom", "actif", "staff", "password"]
        rows = [["awa.bah", "awa@example.com", "Awa", "Bah", "oui", "non", "secret12345"]]
        return build_csv_response("modele_utilisateurs.csv", headers, rows)


class ProductImportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"detail": "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = import_products_from_file(uploaded_file, request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)


class CustomerImportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"detail": "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = import_customers_from_file(uploaded_file, request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)


class UserImportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"detail": "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = import_users_from_file(uploaded_file, request.user, User)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )

        if user is None:
            log_activity(
                action="login_failed",
                description="Tentative de connexion echouee.",
                entity_type="auth",
                metadata={"username": serializer.validated_data["username"]},
            )
            return Response(
                {"detail": "Nom d utilisateur ou mot de passe invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(user)
        log_activity(
            action="login_success",
            description=f"Connexion reussie pour {user.username}.",
            entity_type="auth",
            entity_id=user.id,
            user=user,
        )
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class OrderInvoiceDownloadView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(Order.objects.prefetch_related("items__product").select_related("customer"), pk=pk)
        buffer = generate_invoice_pdf(order)
        upload_order_invoice_to_minio(order, clone_buffer(buffer))
        log_activity(
            action="invoice_downloaded",
            description=f"Facture de la commande {order.number} telechargee.",
            entity_type="order",
            entity_id=order.id,
            user=request.user,
            metadata={"object_name": order.invoice_object_name},
        )
        return HttpResponse(
            buffer.getvalue(),
            content_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="facture_{order.number}.pdf"'},
        )


class InvoiceExcelExportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects.filter(status__in=[Order.STATUS_CONFIRMED, Order.STATUS_DELIVERED])
            .select_related("customer")
            .order_by("-created_at")
        )
        headers = [
            "ID",
            "Numero commande",
            "Numero facture",
            "Client",
            "Date emission",
            "Total (GNF)",
            "Statut",
        ]
        rows = []
        for order in orders:
            issue = order.confirmed_at or order.created_at
            fac_num = (
                f"FAC-{order.number.replace('CMD-', '', 1)}"
                if order.number.startswith("CMD-")
                else f"FAC-{order.number}"
            )
            rows.append(
                [
                    order.id,
                    order.number,
                    fac_num,
                    order.customer.full_name,
                    issue.isoformat() if issue else "",
                    str(order.total),
                    order.get_status_display(),
                ]
            )
        return build_excel_response("factures.xlsx", "Factures", headers, rows)


class InvoicePdfZipExportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects.filter(status__in=[Order.STATUS_CONFIRMED, Order.STATUS_DELIVERED])
            .select_related("customer")
            .prefetch_related("items__product")
            .order_by("-created_at")
        )
        buf = BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as archive:
            for order in orders:
                pdf_buffer = generate_invoice_pdf(order)
                archive.writestr(f"facture_{order.number}.pdf", pdf_buffer.getvalue())
        buf.seek(0)
        response = HttpResponse(buf.getvalue(), content_type="application/zip")
        response["Content-Disposition"] = 'attachment; filename="factures.zip"'
        return response