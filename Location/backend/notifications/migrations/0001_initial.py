# Generated manually

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type_notification', models.CharField(choices=[('paiement_retard', 'Paiement en retard'), ('echeance_proche', 'Échéance proche'), ('contrat_expiration', 'Contrat expirant'), ('maintenance_requise', 'Maintenance requise'), ('nouveau_paiement', 'Nouveau paiement'), ('nouveau_contrat', 'Nouveau contrat'), ('document_ajoute', 'Document ajouté'), ('systeme', 'Système'), ('autre', 'Autre')], max_length=50)),
                ('titre', models.CharField(max_length=200)),
                ('message', models.TextField()),
                ('priorite', models.CharField(choices=[('faible', 'Faible'), ('normale', 'Normale'), ('haute', 'Haute'), ('urgente', 'Urgente')], default='normale', max_length=20)),
                ('lu', models.BooleanField(default=False)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_lecture', models.DateTimeField(blank=True, null=True)),
                ('bien_id', models.IntegerField(blank=True, null=True)),
                ('client_id', models.IntegerField(blank=True, null=True)),
                ('contrat_id', models.IntegerField(blank=True, null=True)),
                ('paiement_id', models.IntegerField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-date_creation'],
            },
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'lu'], name='notificatio_user_id_lu_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['type_notification'], name='notificatio_type_no_idx'),
        ),
    ]
