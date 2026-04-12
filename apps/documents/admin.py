from django.contrib import admin

from apps.documents.models import Document, DocumentCategory


@admin.register(DocumentCategory)
class DocumentCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "description"]


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "version", "is_current_version", "uploaded_by", "created_at"]
    list_filter = ["category", "is_current_version"]
    search_fields = ["title"]
