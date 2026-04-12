from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from apps.documents.models import Document, DocumentCategory


class DocumentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentCategory
        fields = ["id", "name", "description"]


class DocumentSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    uploaded_by_name = serializers.CharField(source="uploaded_by.get_full_name", read_only=True)

    class Meta:
        model = Document
        fields = [
            "id", "category", "category_name", "title", "file",
            "file_size", "mime_type", "version", "is_current_version",
            "uploaded_by", "uploaded_by_name", "created_at",
        ]
        read_only_fields = ["id", "file_size", "mime_type", "version", "is_current_version", "uploaded_by", "created_at"]


class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["category", "title", "file"]

    def validate_file(self, value):
        max_size = 10 * 1024 * 1024  # 10 MB
        if value.size > max_size:
            raise serializers.ValidationError("File size cannot exceed 10 MB.")

        allowed_types = [
            "application/pdf",
            "image/jpeg", "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Unsupported file type. Allowed: PDF, JPEG, PNG, DOC, DOCX."
            )
        return value
