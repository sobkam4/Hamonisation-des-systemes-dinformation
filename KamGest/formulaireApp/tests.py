import json

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import ActivityLog, Customer, Delivery, Order, Product


class AuthenticationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="adminuser",
            password="secret123",
            email="admin@example.com",
            is_staff=True,
        )

    def test_login_me_refresh_and_logout_flow(self):
        login_response = self.client.post(
            "/api/auth/login/",
            data={"username": "adminuser", "password": "secret123"},
            content_type="application/json",
        )
        self.assertEqual(login_response.status_code, 200)
        login_data = login_response.json()
        self.assertEqual(login_data["user"]["username"], "adminuser")
        self.assertIn("access", login_data["tokens"])
        self.assertIn("refresh", login_data["tokens"])

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_data['tokens']['access']}")
        me_response = self.client.get("/api/auth/me/")
        self.assertEqual(me_response.status_code, 200)
        self.assertTrue(me_response.json()["is_staff"])

        refresh_response = self.client.post(
            "/api/auth/refresh/",
            data={"refresh": login_data["tokens"]["refresh"]},
            content_type="application/json",
        )
        self.assertEqual(refresh_response.status_code, 200)
        self.assertIn("access", refresh_response.json())

        logout_response = self.client.post("/api/auth/logout/", content_type="application/json")
        self.assertEqual(logout_response.status_code, 204)
        self.assertTrue(ActivityLog.objects.filter(action="login_success", user=self.user).exists())


class SalesApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="seller",
            password="secret123",
            email="seller@example.com",
            is_staff=True,
        )
        access_token = str(RefreshToken.for_user(self.user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        self.customer = Customer.objects.create(
            first_name="Aminata",
            last_name="Diallo",
            phone="622000000",
            email="aminata@example.com",
            address="Matam",
            city="Conakry",
        )
        self.product = Product.objects.create(
            reference="ART-001",
            name="Ordinateur portable",
            sale_price="6500000.00",
            stock_quantity=10,
            low_stock_threshold=2,
        )

    def test_authenticated_user_can_create_confirmed_order_and_reduce_stock(self):
        response = self.client.post(
            "/api/orders/",
            data={
                "customer": self.customer.id,
                "status": "confirmed",
                "payment_method": "cash",
                "delivery_address": "Matam",
                "items": [
                    {
                        "product": self.product.id,
                        "quantity": 2,
                        "unit_price": "6500000.00",
                    }
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 8)
        self.assertEqual(response.json()["total"], "13000000.00")
        self.assertTrue(ActivityLog.objects.filter(action="order_created", user=self.user).exists())
        order_id = response.json()["id"]
        self.assertTrue(Delivery.objects.filter(order_id=order_id).exists())

    def test_cancelling_order_restores_stock(self):
        order = Order.objects.create(
            customer=self.customer,
            seller=self.user,
            status="confirmed",
            payment_method="cash",
            delivery_address="Matam",
        )
        order.items.create(
            product=self.product,
            product_name=self.product.name,
            quantity=2,
            unit_price="6500000.00",
            subtotal="13000000.00",
        )
        self.product.stock_quantity = 8
        self.product.save(update_fields=["stock_quantity"])

        response = self.client.patch(
            f"/api/orders/{order.id}/",
            data=json.dumps({"status": "cancelled"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 10)

    def test_dashboard_stats_and_invoice_work(self):
        order = Order.objects.create(
            customer=self.customer,
            seller=self.user,
            status="delivered",
            payment_method="cash",
            delivery_address="Matam",
            subtotal="6500000.00",
            total="6500000.00",
        )
        order.items.create(
            product=self.product,
            product_name=self.product.name,
            quantity=1,
            unit_price="6500000.00",
            subtotal="6500000.00",
        )

        stats_response = self.client.get("/api/dashboard/stats/")
        self.assertEqual(stats_response.status_code, 200)
        self.assertEqual(stats_response.json()["orders_count"], 1)
        self.assertEqual(stats_response.json()["customers_count"], 1)

        invoice_response = self.client.get(f"/api/orders/{order.id}/invoice/")
        self.assertEqual(invoice_response.status_code, 200)
        self.assertEqual(invoice_response["Content-Type"], "application/pdf")
        self.assertIn(f'facture_{order.number}.pdf', invoice_response["Content-Disposition"])
        self.assertTrue(invoice_response.content.startswith(b"%PDF"))

    def test_authenticated_user_can_import_and_export_products(self):
        upload = SimpleUploadedFile(
            "products.csv",
            (
                "reference,nom,categorie,description,prix_vente,stock,seuil_stock_faible,actif\n"
                "ART-002,Imprimante,Bureautique,Wifi,1200000,4,2,oui\n"
            ).encode("utf-8"),
            content_type="text/csv",
        )
        import_response = self.client.post("/api/imports/products/", data={"file": upload}, format="multipart")
        self.assertEqual(import_response.status_code, 200)
        self.assertEqual(import_response.json()["created"], 1)
        self.assertTrue(Product.objects.filter(reference="ART-002").exists())

        export_response = self.client.get("/api/exports/products/")
        self.assertEqual(export_response.status_code, 200)
        self.assertEqual(
            export_response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    def test_authenticated_user_can_import_customers(self):
        upload = SimpleUploadedFile(
            "customers.csv",
            (
                "prenom,nom,telephone,email,adresse,ville,notes\n"
                "Fatou,Camara,620000000,fatou@example.com,Matoto,Conakry,VIP\n"
            ).encode("utf-8"),
            content_type="text/csv",
        )
        response = self.client.post("/api/imports/customers/", data={"file": upload}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["created"], 1)
        self.assertTrue(Customer.objects.filter(email="fatou@example.com").exists())


class UserManagementApiTests(TestCase):
    def setUp(self):
        self.staff_user = get_user_model().objects.create_user(
            username="manager",
            password="secret123",
            email="manager@example.com",
            is_staff=True,
        )
        self.regular_user = get_user_model().objects.create_user(
            username="member",
            password="secret123",
            email="member@example.com",
            is_staff=False,
        )

    def test_staff_can_list_create_and_update_users(self):
        client = APIClient()
        access_token = str(RefreshToken.for_user(self.staff_user).access_token)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        list_response = client.get("/api/users/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 2)

        create_response = client.post(
            "/api/users/",
            data=json.dumps(
                {
                    "username": "newuser",
                    "email": "newuser@example.com",
                    "first_name": "New",
                    "last_name": "User",
                    "is_active": True,
                    "is_staff": False,
                    "password": "secret12345",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(create_response.status_code, 201)
        created_user_id = create_response.json()["id"]

        update_response = client.patch(
            f"/api/users/{created_user_id}/",
            data=json.dumps({"first_name": "Updated", "is_staff": True}),
            content_type="application/json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.json()["first_name"], "Updated")
        self.assertTrue(update_response.json()["is_staff"])

    def test_non_staff_cannot_access_user_management_api(self):
        client = APIClient()
        access_token = str(RefreshToken.for_user(self.regular_user).access_token)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = client.get("/api/users/")
        self.assertEqual(response.status_code, 403)


class ActivityLogApiTests(TestCase):
    def test_staff_can_list_and_export_activity_logs(self):
        user = get_user_model().objects.create_user(
            username="logadmin",
            password="secret123",
            is_staff=True,
        )
        ActivityLog.objects.create(
            user=user,
            action="login_success",
            entity_type="auth",
            entity_id=str(user.id),
            description="Connexion reussie pour logadmin.",
        )

        client = APIClient()
        access_token = str(RefreshToken.for_user(user).access_token)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        list_response = client.get("/api/activity-logs/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 1)

        export_response = client.get("/api/exports/activity-logs/")
        self.assertEqual(export_response.status_code, 200)
        self.assertEqual(export_response["Content-Type"], "application/pdf")
        self.assertTrue(export_response.content.startswith(b"%PDF"))
