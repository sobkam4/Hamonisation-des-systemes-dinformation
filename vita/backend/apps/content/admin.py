from django.contrib import admin

from apps.content.models import Category, ContentBundle, MediaAsset, Protocol, ProtocolStep


class ProtocolStepInline(admin.TabularInline):
    model = ProtocolStep
    extra = 0


@admin.register(Protocol)
class ProtocolAdmin(admin.ModelAdmin):
    list_display = ("slug", "title", "locale", "version", "is_published")
    list_filter = ("locale", "is_published")
    inlines = [ProtocolStepInline]


admin.site.register(Category)
admin.site.register(MediaAsset)
admin.site.register(ContentBundle)
