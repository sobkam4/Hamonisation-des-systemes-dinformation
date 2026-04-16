import secrets
from decimal import Decimal

from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Ticket(models.Model):
    code = models.CharField(max_length=20, unique=True, editable=False)
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE)
    nom = models.CharField(max_length=25)
    prenom = models.CharField(max_length=30)
    quartier = models.CharField(max_length=30)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="GNF")
    status = models.CharField(
        max_length=20,
        choices=[
            ("unused", "Non utilise"),
            ("used", "Utilise"),
            ("expired", "Expire"),
        ],
        default="unused",
    )
    payment_method = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(null=True, blank=True)
    invoice_object_name = models.CharField(max_length=255, null=True, blank=True)
    invoice_uploaded_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = secrets.token_hex(6).upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} - {self.user}"


class ActivityLog(models.Model):
    ACTION_CHOICES = [
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
    ]

    user = models.ForeignKey("auth.User", on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    entity_type = models.CharField(max_length=50)
    entity_id = models.CharField(max_length=50, null=True, blank=True)
    description = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} - {self.description}"


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        related_name="products",
        null=True,
        blank=True,
    )
    reference = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold

    def __str__(self):
        return f"{self.reference} - {self.name}"

    @classmethod
    def generate_reference(cls):
        for _ in range(50):
            ref = f"PRD-{timezone.now().strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(2).upper()}"
            if not cls.objects.filter(reference=ref).exists():
                return ref
        return f"PRD-{secrets.token_hex(8).upper()}"

    def save(self, *args, **kwargs):
        if self._state.adding and (not self.reference or not str(self.reference).strip()):
            self.reference = self.generate_reference()
        super().save(*args, **kwargs)


class Customer(models.Model):
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)
    attachment = models.FileField(
        upload_to="customer_attachments/%Y/%m/",
        blank=True,
        null=True,
        max_length=500,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return self.full_name or self.email or f"Client {self.pk}"


class Order(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_CONFIRMED = "confirmed"
    STATUS_DELIVERED = "delivered"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Brouillon"),
        (STATUS_CONFIRMED, "Confirmee"),
        (STATUS_DELIVERED, "Livree"),
        (STATUS_CANCELLED, "Annulee"),
    ]

    number = models.CharField(max_length=24, unique=True, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="orders")
    seller = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
        blank=True,
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    payment_method = models.CharField(max_length=50, blank=True)
    currency = models.CharField(max_length=10, default="GNF")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    delivery_address = models.CharField(max_length=255, blank=True)
    invoice_object_name = models.CharField(max_length=255, null=True, blank=True)
    invoice_uploaded_at = models.DateTimeField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.number:
            timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
            self.number = f"CMD-{timestamp}-{secrets.token_hex(2).upper()}"
        if self.status in {self.STATUS_CONFIRMED, self.STATUS_DELIVERED} and not self.confirmed_at:
            self.confirmed_at = timezone.now()
        if self.status == self.STATUS_CANCELLED:
            self.confirmed_at = None
        super().save(*args, **kwargs)

    def __str__(self):
        return self.number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    product_name = models.CharField(max_length=160)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ["id"]

    def save(self, *args, **kwargs):
        self.unit_price = Decimal(self.unit_price)
        self.subtotal = Decimal(self.quantity) * self.unit_price
        if not self.product_name:
            self.product_name = self.product.name
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order.number} - {self.product_name}"


class Delivery(models.Model):
    STATUS_PENDING = "pending"
    STATUS_IN_TRANSIT = "in_transit"
    STATUS_DELIVERED = "delivered"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "En attente"),
        (STATUS_IN_TRANSIT, "En transit"),
        (STATUS_DELIVERED, "Livree"),
        (STATUS_CANCELLED, "Annulee"),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="delivery")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    address = models.CharField(max_length=255)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.status == self.STATUS_DELIVERED and not self.delivered_at:
            self.delivered_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Livraison {self.order.number}"


class StockMovement(models.Model):
    TYPE_IN = "in"
    TYPE_OUT = "out"
    TYPE_ADJUSTMENT = "adjustment"
    TYPE_RETURN = "return"
    MOVEMENT_CHOICES = [
        (TYPE_IN, "Entree"),
        (TYPE_OUT, "Sortie"),
        (TYPE_ADJUSTMENT, "Ajustement"),
        (TYPE_RETURN, "Retour"),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="stock_movements")
    order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_movements",
    )
    created_by = models.ForeignKey("auth.User", on_delete=models.SET_NULL, null=True, blank=True)
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_CHOICES)
    quantity = models.IntegerField()
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.reference} {self.movement_type} {self.quantity}"