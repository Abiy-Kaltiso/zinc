from django.urls import path

from apps.notifications.views import (
    CommunicationLogDetailView,
    CommunicationLogListCreateView,
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    NotificationUnreadCountView,
)

app_name = "notifications"

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("<int:pk>/read/", NotificationMarkReadView.as_view(), name="notification-read"),
    path("mark-all-read/", NotificationMarkAllReadView.as_view(), name="notification-mark-all-read"),
    path("unread-count/", NotificationUnreadCountView.as_view(), name="notification-unread-count"),
    path("leases/<int:lease_pk>/communications/", CommunicationLogListCreateView.as_view(), name="communication-log"),
    path("leases/<int:lease_pk>/communications/<int:pk>/", CommunicationLogDetailView.as_view(), name="communication-detail"),
]
