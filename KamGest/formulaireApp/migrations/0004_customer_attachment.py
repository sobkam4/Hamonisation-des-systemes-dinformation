from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("formulaireApp", "0003_sales_platform_models"),
    ]

    operations = [
        migrations.AddField(
            model_name="customer",
            name="attachment",
            field=models.FileField(
                blank=True,
                max_length=500,
                null=True,
                upload_to="customer_attachments/%Y/%m/",
            ),
        ),
    ]
