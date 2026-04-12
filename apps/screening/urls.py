from django.urls import path

from apps.screening.views import (
    LeaseScreeningView,
    ScreeningChecklistDetailView,
    ScreeningChecklistListCreateView,
    ScreeningCheckUpdateView,
    ScreeningVerifyView,
)

app_name = "screening"

urlpatterns = [
    path("checklists/", ScreeningChecklistListCreateView.as_view(), name="checklist-list"),
    path("checklists/<int:pk>/", ScreeningChecklistDetailView.as_view(), name="checklist-detail"),
    path("leases/<int:lease_pk>/", LeaseScreeningView.as_view(), name="lease-screening"),
    path("leases/<int:lease_pk>/checks/<int:pk>/", ScreeningCheckUpdateView.as_view(), name="check-update"),
    path("leases/<int:lease_pk>/verify/", ScreeningVerifyView.as_view(), name="screening-verify"),
]
