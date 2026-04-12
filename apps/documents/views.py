from django.contrib.contenttypes.models import ContentType
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.documents.models import Document, DocumentCategory
from apps.documents.serializers import DocumentCategorySerializer, DocumentSerializer, DocumentUploadSerializer
from apps.leases.models import Lease


class DocumentCategoryListView(generics.ListAPIView):
    serializer_class = DocumentCategorySerializer
    permission_classes = [IsAuthenticated]
    queryset = DocumentCategory.objects.all()


class LeaseDocumentListView(generics.ListAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        lease_ct = ContentType.objects.get_for_model(Lease)
        return Document.objects.filter(
            content_type=lease_ct,
            object_id=self.kwargs["lease_pk"],
        ).select_related("category", "uploaded_by")


class LeaseDocumentUploadView(generics.CreateAPIView):
    serializer_class = DocumentUploadSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        lease = Lease.objects.get(pk=self.kwargs["lease_pk"])
        lease_ct = ContentType.objects.get_for_model(Lease)
        serializer.save(
            uploaded_by=self.request.user,
            content_type=lease_ct,
            object_id=lease.pk,
            file_size=serializer.validated_data["file"].size,
            mime_type=serializer.validated_data["file"].content_type,
        )


class DocumentDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    queryset = Document.objects.select_related("category", "uploaded_by")


class DocumentNewVersionView(generics.CreateAPIView):
    serializer_class = DocumentUploadSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        previous = Document.objects.get(pk=self.kwargs["pk"])
        # Mark previous version as not current
        previous.is_current_version = False
        previous.save(update_fields=["is_current_version"])

        serializer.save(
            uploaded_by=self.request.user,
            content_type=previous.content_type,
            object_id=previous.object_id,
            file_size=serializer.validated_data["file"].size,
            mime_type=serializer.validated_data["file"].content_type,
            version=previous.version + 1,
            previous_version=previous,
        )
