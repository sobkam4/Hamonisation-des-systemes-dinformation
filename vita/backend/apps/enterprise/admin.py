from django.contrib import admin

from apps.enterprise.models import FirstAidKitItem, Organization, OrganizationMember, WorkIncident


class MemberInline(admin.TabularInline):
    model = OrganizationMember
    extra = 0
    raw_id_fields = ("user",)


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    inlines = [MemberInline]


admin.site.register(WorkIncident)
admin.site.register(FirstAidKitItem)
