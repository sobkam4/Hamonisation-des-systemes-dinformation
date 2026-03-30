# Generated manually

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('paiements', '0001_initial'),
        ('contrats', '0001_initial'),
        ('clients', '0001_initial'),
        ('biens', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Document',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type_document', models.CharField(choices=[('contrat', 'Contrat de location'), ('quittance', 'Quittance de loyer'), ('facture', 'Facture'), ('recu', 'Reçu de paiement'), ('piece_identite', 'Pièce d\'identité'), ('justificatif', 'Justificatif'), ('photo', 'Photo'), ('autre', 'Autre')], max_length=50)),
                ('titre', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('fichier', models.FileField(upload_to='documents/%Y/%m/', validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'])])),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_modification', models.DateTimeField(auto_now=True)),
                ('bien', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='documents', to='biens.bien')),
                ('client', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='documents', to='clients.client')),
                ('contrat', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='documents', to='contrats.contrat')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='documents_crees', to=settings.AUTH_USER_MODEL)),
                ('paiement', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='documents', to='paiements.paiement')),
            ],
            options={
                'ordering': ['-date_creation'],
            },
        ),
        migrations.AddIndex(
            model_name='document',
            index=models.Index(fields=['type_document'], name='documents_d_type_do_idx'),
        ),
        migrations.AddIndex(
            model_name='document',
            index=models.Index(fields=['bien'], name='documents_d_bien_id_idx'),
        ),
        migrations.AddIndex(
            model_name='document',
            index=models.Index(fields=['client'], name='documents_d_client__idx'),
        ),
    ]
