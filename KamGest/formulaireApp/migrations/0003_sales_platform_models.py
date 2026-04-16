from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("formulaireApp", "0002_ticket_invoice_object_name_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="activitylog",
            name="action",
            field=models.CharField(
                choices=[
                    ("login_success", "Connexion reussie"),
                    ("login_failed", "Connexion echouee"),
                    ("ticket_created", "Ticket cree"),
                    ("ticket_updated", "Ticket modifie"),
                    ("ticket_deleted", "Ticket supprime"),
                    ("product_created", "Article cree"),
                    ("product_updated", "Article modifie"),
                    ("customer_created", "Client cree"),
                    ("customer_updated", "Client modifie"),
                    ("order_created", "Commande creee"),
                    ("order_updated", "Commande modifiee"),
                    ("order_deleted", "Commande supprimee"),
                    ("delivery_updated", "Livraison modifiee"),
                    ("invoice_downloaded", "Facture telechargee"),
                    ("stock_adjusted", "Stock ajuste"),
                    ("user_created", "Utilisateur cree"),
                    ("user_updated", "Utilisateur modifie"),
                ],
                max_length=50,
            ),
        ),
        migrations.CreateModel(
            name="Category",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True)),
                ("slug", models.SlugField(blank=True, max_length=140, unique=True)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["name"],
                "verbose_name_plural": "categories",
            },
        ),
        migrations.CreateModel(
            name="Customer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("first_name", models.CharField(max_length=80)),
                ("last_name", models.CharField(max_length=80)),
                ("phone", models.CharField(blank=True, max_length=30)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("address", models.CharField(blank=True, max_length=255)),
                ("city", models.CharField(blank=True, max_length=120)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["last_name", "first_name"],
            },
        ),
        migrations.CreateModel(
            name="Order",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("number", models.CharField(editable=False, max_length=24, unique=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Brouillon"),
                            ("confirmed", "Confirmee"),
                            ("delivered", "Livree"),
                            ("cancelled", "Annulee"),
                        ],
                        default="draft",
                        max_length=20,
                    ),
                ),
                ("payment_method", models.CharField(blank=True, max_length=50)),
                ("currency", models.CharField(default="GNF", max_length=10)),
                ("subtotal", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("total", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("notes", models.TextField(blank=True)),
                ("delivery_address", models.CharField(blank=True, max_length=255)),
                ("invoice_object_name", models.CharField(blank=True, max_length=255, null=True)),
                ("invoice_uploaded_at", models.DateTimeField(blank=True, null=True)),
                ("confirmed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("customer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="orders", to="formulaireApp.customer")),
                ("seller", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="orders", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reference", models.CharField(max_length=40, unique=True)),
                ("name", models.CharField(max_length=160)),
                ("description", models.TextField(blank=True)),
                ("sale_price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("stock_quantity", models.PositiveIntegerField(default=0)),
                ("low_stock_threshold", models.PositiveIntegerField(default=5)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "category",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="products",
                        to="formulaireApp.category",
                    ),
                ),
            ],
            options={
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="Delivery",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "En attente"),
                            ("in_transit", "En transit"),
                            ("delivered", "Livree"),
                            ("cancelled", "Annulee"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("address", models.CharField(max_length=255)),
                ("scheduled_for", models.DateTimeField(blank=True, null=True)),
                ("delivered_at", models.DateTimeField(blank=True, null=True)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("order", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="delivery", to="formulaireApp.order")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="OrderItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("product_name", models.CharField(max_length=160)),
                ("quantity", models.PositiveIntegerField()),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("subtotal", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("order", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="formulaireApp.order")),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="order_items", to="formulaireApp.product")),
            ],
            options={
                "ordering": ["id"],
            },
        ),
        migrations.CreateModel(
            name="StockMovement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "movement_type",
                    models.CharField(
                        choices=[
                            ("in", "Entree"),
                            ("out", "Sortie"),
                            ("adjustment", "Ajustement"),
                            ("return", "Retour"),
                        ],
                        max_length=20,
                    ),
                ),
                ("quantity", models.IntegerField()),
                ("note", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ("order", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="stock_movements", to="formulaireApp.order")),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="stock_movements", to="formulaireApp.product")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
