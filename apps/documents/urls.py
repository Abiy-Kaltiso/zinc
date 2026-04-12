from django.urls import path

from apps.documents.views import (
    DocumentCategoryListView,
    DocumentDetailView,
    DocumentNewVersionView,
    LeaseDocumentListView,
    LeaseDocumentUploadView,
)

app_name = "documents"

urlpatterns = [
    path("categories/", DocumentCategoryListView.as_view(), name="category-list"),
    path("lease/<int:lease_pk>/", LeaseDocumentListView.as_view(), name="lease-document-list"),
    path("lease/<int:lease_pk>/upload/", LeaseDocumentUploadView.as_view(), name="lease-document-upload"),
    path("<int:pk>/", DocumentDetailView.as_view(), name="document-detail"),
    path("<int:pk>/new-version/", DocumentNewVersionView.as_view(), name="document-new-version"),
]
