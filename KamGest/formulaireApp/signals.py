from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Delivery, Order


def ensure_delivery_for_order(order):
    """Cree une livraison en attente si la commande n'en a pas encore (OneToOne)."""
    if not order.pk:
        return
    if Delivery.objects.filter(order_id=order.pk).exists():
        return
    order = Order.objects.select_related("customer").filter(pk=order.pk).first()
    if not order:
        return
    addr = (order.delivery_address or "").strip()
    if not addr:
        addr = (order.customer.address or "").strip()
    if not addr:
        addr = "-"
    Delivery.objects.create(
        order=order,
        address=addr,
        status=Delivery.STATUS_PENDING,
    )


@receiver(post_save, sender=Order)
def order_create_delivery_if_missing(sender, instance, **kwargs):
    ensure_delivery_for_order(instance)
