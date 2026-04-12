from django.urls import path

from apps.reports.views import (
    ActiveLeasesReportView,
    ComplianceReportView,
    DashboardView,
    ExpirationTimelineView,
    LeaseExportCSVView,
    OccupancyOverviewView,
)

app_name = "reports"

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("leases/active/", ActiveLeasesReportView.as_view(), name="active-leases"),
    path("leases/compliance/", ComplianceReportView.as_view(), name="compliance"),
    path("leases/expirations/", ExpirationTimelineView.as_view(), name="expirations"),
    path("occupancy/", OccupancyOverviewView.as_view(), name="occupancy"),
    path("export/leases/csv/", LeaseExportCSVView.as_view(), name="export-leases-csv"),
]
