from django.contrib import admin

from apps.vital_passport.models import VitalPassport


@admin.register(VitalPassport)
class VitalPassportAdmin(admin.ModelAdmin):
    list_display = ("user", "organ_donor", "updated_at")
    raw_id_fields = ("user",)
    readonly_fields = ("payload_encrypted",)
