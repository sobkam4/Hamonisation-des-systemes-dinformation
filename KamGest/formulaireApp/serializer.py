from collections import defaultdict
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import (
    ActivityLog,
    Category,
    Customer,
    Delivery,
    Order,
    OrderItem,
    Product,
    StockMovement,
    Ticket,
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
            "last_login",
        ]
        read_only_fields = fields


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, trim_whitespace=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
            "last_login",
            "password",
        ]
        read_only_fields = ["id", "is_superuser", "date_joined", "last_login"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = "__all__"
        read_only_fields = ["code", "created_at", "user"]

    def update(self, instance, validated_data):
        if instance.status == "used":
            raise serializers.ValidationError("Ticket deja utilise.")
        return super().update(instance, validated_data)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "created_at"]
        read_only_fields = ["slug", "created_at"]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "category_name",
            "reference",
            "name",
            "description",
            "sale_price",
            "stock_quantity",
            "low_stock_threshold",
            "is_low_stock",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "category_name", "is_low_stock"]
        extra_kwargs = {"reference": {"required": False, "allow_blank": True}}

    def validate(self, attrs):
        if self.instance is None:
            ref = attrs.get("reference")
            if ref is None or (isinstance(ref, str) and not str(ref).strip()):
                attrs.pop("reference", None)
        else:
            if "reference" in attrs and (
                attrs["reference"] is None
                or (isinstance(attrs["reference"], str) and not str(attrs["reference"]).strip())
            ):
                raise serializers.ValidationError(
                    {"reference": "La reference ne peut pas etre vide."}
                )
        return attrs

    def create(self, validated_data):
        if "reference" not in validated_data:
            validated_data["reference"] = Product.generate_reference()
        return super().create(validated_data)


class CustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "email",
            "address",
            "city",
            "notes",
            "attachment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["full_name", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        file_field = instance.attachment
        if file_field:
            url = file_field.url
            if request:
                data["attachment"] = request.build_absolute_uri(url)
            else:
                data["attachment"] = url
        else:
            data["attachment"] = None
        return data


class OrderItemSerializer(serializers.ModelSerializer):
    product_reference = serializers.CharField(source="product.reference", read_only=True)
    product_name = serializers.CharField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_reference",
            "product_name",
            "quantity",
            "unit_price",
            "subtotal",
        ]
        read_only_fields = ["id", "product_reference", "product_name", "subtotal"]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("La quantite doit etre superieure a zero.")
        return value


class DeliverySerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.number", read_only=True)

    class Meta:
        model = Delivery
        fields = [
            "id",
            "order",
            "order_number",
            "status",
            "address",
            "scheduled_for",
            "delivered_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["order_number", "delivered_at", "created_at", "updated_at"]


class StockMovementSerializer(serializers.ModelSerializer):
    product_reference = serializers.CharField(source="product.reference", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    order_number = serializers.CharField(source="order.number", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "product",
            "product_reference",
            "product_name",
            "order_number",
            "movement_type",
            "quantity",
            "note",
            "created_at",
        ]
        read_only_fields = ["id", "product_reference", "product_name", "created_at"]

    def validate_quantity(self, value):
        if value == 0:
            raise serializers.ValidationError("La quantite ne peut pas etre egale a zero.")
        return value

    def create(self, validated_data):
        product = validated_data["product"]
        movement_type = validated_data["movement_type"]
        requested_quantity = validated_data["quantity"]
        validated_data = {**validated_data}
        quantity = abs(requested_quantity)

        if movement_type == StockMovement.TYPE_OUT:
            if product.stock_quantity < quantity:
                raise serializers.ValidationError(
                    {"quantity": f"Stock insuffisant pour {product.name}. Disponible: {product.stock_quantity}."}
                )
            product.stock_quantity -= quantity
            stored_quantity = -quantity
        elif movement_type == StockMovement.TYPE_IN:
            product.stock_quantity += quantity
            stored_quantity = quantity
        else:
            product.stock_quantity += requested_quantity
            if product.stock_quantity < 0:
                raise serializers.ValidationError(
                    {"quantity": f"Le stock de {product.name} ne peut pas devenir negatif."}
                )
            stored_quantity = requested_quantity

        product.save(update_fields=["stock_quantity", "updated_at"])

        validated_data["quantity"] = stored_quantity

        return StockMovement.objects.create(
            created_by=getattr(self.context.get("request"), "user", None),
            **validated_data,
        )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    seller_username = serializers.CharField(source="seller.username", read_only=True)
    delivery = DeliverySerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "number",
            "customer",
            "customer_name",
            "seller",
            "seller_username",
            "status",
            "payment_method",
            "currency",
            "subtotal",
            "total",
            "notes",
            "delivery_address",
            "invoice_object_name",
            "invoice_uploaded_at",
            "confirmed_at",
            "created_at",
            "updated_at",
            "items",
            "delivery",
        ]
        read_only_fields = [
            "number",
            "seller",
            "seller_username",
            "customer_name",
            "subtotal",
            "total",
            "invoice_object_name",
            "invoice_uploaded_at",
            "confirmed_at",
            "created_at",
            "updated_at",
            "delivery",
        ]

    def validate(self, attrs):
        if self.instance is None and not attrs.get("items"):
            raise serializers.ValidationError({"items": "Ajoute au moins un article a la commande."})
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        seller = getattr(self.context.get("request"), "user", None)

        with transaction.atomic():
            order = Order.objects.create(seller=seller, **validated_data)
            created_items = self._replace_items(order, items_data)
            self._update_totals(order, created_items)
            self._sync_stock(order, old_reserved={}, new_reserved=self._reserved_for_status(order.status, created_items))
            order.refresh_from_db()
            return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        with transaction.atomic():
            previous_items = list(instance.items.select_related("product"))
            old_reserved = self._reserved_for_status(instance.status, previous_items)

            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if items_data is not None:
                current_items = self._replace_items(instance, items_data)
            else:
                current_items = list(instance.items.select_related("product"))

            self._update_totals(instance, current_items)
            self._sync_stock(instance, old_reserved=old_reserved, new_reserved=self._reserved_for_status(instance.status, current_items))
            instance.refresh_from_db()
            return instance

    def _replace_items(self, order, items_data):
        order.items.all().delete()
        created_items = []
        for item_data in items_data:
            product = item_data["product"]
            unit_price = Decimal(item_data.get("unit_price") or product.sale_price)
            item = OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                quantity=item_data["quantity"],
                unit_price=unit_price,
                subtotal=unit_price * item_data["quantity"],
            )
            created_items.append(item)
        return created_items

    def _update_totals(self, order, items):
        subtotal = sum((item.subtotal for item in items), Decimal("0"))
        order.subtotal = subtotal
        order.total = subtotal
        order.save(update_fields=["subtotal", "total", "updated_at"])

    def _reserved_for_status(self, status, items):
        if status not in {Order.STATUS_CONFIRMED, Order.STATUS_DELIVERED}:
            return {}
        reserved = defaultdict(int)
        for item in items:
            reserved[item.product_id] += item.quantity
        return reserved

    def _sync_stock(self, order, *, old_reserved, new_reserved):
        product_ids = sorted(set(old_reserved) | set(new_reserved))
        if not product_ids:
            return

        actor = getattr(self.context.get("request"), "user", None)
        products = {
            product.id: product
            for product in Product.objects.select_for_update().filter(id__in=product_ids)
        }

        for product_id in product_ids:
            product = products[product_id]
            delta = new_reserved.get(product_id, 0) - old_reserved.get(product_id, 0)
            if delta == 0:
                continue
            if delta > 0 and product.stock_quantity < delta:
                raise serializers.ValidationError(
                    {"items": f"Stock insuffisant pour {product.name}. Disponible: {product.stock_quantity}."}
                )

        for product_id in product_ids:
            product = products[product_id]
            delta = new_reserved.get(product_id, 0) - old_reserved.get(product_id, 0)
            if delta == 0:
                continue

            if delta > 0:
                product.stock_quantity -= delta
                movement_type = StockMovement.TYPE_OUT
                movement_quantity = -delta
                note = f"Sortie de stock pour {order.number}"
            else:
                product.stock_quantity += abs(delta)
                movement_type = StockMovement.TYPE_RETURN
                movement_quantity = abs(delta)
                note = f"Restockage suite a la mise a jour de {order.number}"

            product.save(update_fields=["stock_quantity", "updated_at"])
            StockMovement.objects.create(
                product=product,
                order=order,
                created_by=actor,
                movement_type=movement_type,
                quantity=movement_quantity,
                note=note,
            )


class ActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "user",
            "action",
            "entity_type",
            "entity_id",
            "description",
            "metadata",
            "created_at",
            "username",
        ]
        read_only_fields = fields

    def get_username(self, obj):
        return obj.user.username if obj.user else "-"