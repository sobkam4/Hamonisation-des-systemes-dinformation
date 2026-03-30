from django.db import migrations


def create_missing_deliveries(apps, schema_editor):
    Order = apps.get_model("formulaireApp", "Order")
    Delivery = apps.get_model("formulaireApp", "Delivery")
    Customer = apps.get_model("formulaireApp", "Customer")
    for order in Order.objects.all().iterator():
        if Delivery.objects.filter(order_id=order.id).exists():
            continue
        addr = (order.delivery_address or "").strip()
        if not addr and order.customer_id:
            cust = Customer.objects.filter(pk=order.customer_id).first()
            if cust:
                addr = (cust.address or "").strip()
        if not addr:
            addr = "-"
        Delivery.objects.create(order_id=order.id, address=addr, status="pending")


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("formulaireApp", "0004_customer_attachment"),
    ]

    operations = [
        migrations.RunPython(create_missing_deliveries, noop_reverse),
    ]
