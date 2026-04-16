from django.contrib import admin

from apps.qr_access.models import QrScanLog, QrToken


admin.site.register(QrToken)
admin.site.register(QrScanLog)
