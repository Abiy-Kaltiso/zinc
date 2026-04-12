from django.urls import path

from apps.leases.views import (
    LeaseActivateView,
    LeaseAmendmentApproveView,
    LeaseAmendmentListCreateView,
    LeaseDetailView,
    LeaseExpiringView,
    LeaseListCreateView,
    LeaseReviewListView,
    LeaseReviewView,
    LeaseSubmitView,
    LeaseTerminateView,
)

app_name = "leases"

urlpatterns = [
    path("", LeaseListCreateView.as_view(), name="lease-list"),
    path("<int:pk>/", LeaseDetailView.as_view(), name="lease-detail"),
    path("<int:pk>/submit/", LeaseSubmitView.as_view(), name="lease-submit"),
    path("<int:pk>/review/", LeaseReviewView.as_view(), name="lease-review"),
    path("<int:pk>/activate/", LeaseActivateView.as_view(), name="lease-activate"),
    path("<int:pk>/terminate/", LeaseTerminateView.as_view(), name="lease-terminate"),
    path("<int:pk>/reviews/", LeaseReviewListView.as_view(), name="lease-review-list"),
    path("<int:pk>/amendments/", LeaseAmendmentListCreateView.as_view(), name="lease-amendment-list"),
    path("<int:pk>/amendments/<int:amendment_pk>/approve/", LeaseAmendmentApproveView.as_view(), name="lease-amendment-approve"),
    path("expiring/", LeaseExpiringView.as_view(), name="lease-expiring"),
]
