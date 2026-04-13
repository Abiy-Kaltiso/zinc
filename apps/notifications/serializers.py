from rest_framework import serializers

from apps.notifications.models import CommunicationLog, Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id", "notification_type", "title", "message",
            "is_read", "email_sent", "created_at",
        ]
        read_only_fields = ["id", "notification_type", "title", "message", "email_sent", "created_at"]


class CommunicationLogSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.get_full_name", read_only=True)
    sender_role = serializers.CharField(source="sender.role", read_only=True)

    class Meta:
        model = CommunicationLog
        fields = ["id", "lease", "sender", "sender_name", "sender_role", "message", "created_at", "updated_at"]
        read_only_fields = ["id", "lease", "sender", "created_at", "updated_at"]
