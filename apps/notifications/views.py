from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import CommunicationLog, Notification
from apps.notifications.serializers import CommunicationLogSerializer, NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        notification = Notification.objects.get(pk=pk, recipient=request.user)
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)
        return Response({"marked_read": count})


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({"unread_count": count})


class CommunicationLogListCreateView(generics.ListCreateAPIView):
    serializer_class = CommunicationLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CommunicationLog.objects.filter(
            lease_id=self.kwargs["lease_pk"]
        ).select_related("sender")

    def perform_create(self, serializer):
        serializer.save(
            sender=self.request.user,
            lease_id=self.kwargs["lease_pk"],
        )
