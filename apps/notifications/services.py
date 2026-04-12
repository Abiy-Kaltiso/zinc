from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType

from apps.notifications.models import Notification

User = get_user_model()


def notify_board_members(notification_type, title, message, related_object=None):
    board_members = User.objects.filter(role__in=["board_member", "admin"])
    ct = None
    obj_id = None
    if related_object:
        ct = ContentType.objects.get_for_model(related_object)
        obj_id = related_object.pk

    notifications = []
    for member in board_members:
        notifications.append(
            Notification(
                recipient=member,
                notification_type=notification_type,
                title=title,
                message=message,
                content_type=ct,
                object_id=obj_id,
            )
        )
    Notification.objects.bulk_create(notifications)


def notify_user(user, notification_type, title, message, related_object=None):
    ct = None
    obj_id = None
    if related_object:
        ct = ContentType.objects.get_for_model(related_object)
        obj_id = related_object.pk

    Notification.objects.create(
        recipient=user,
        notification_type=notification_type,
        title=title,
        message=message,
        content_type=ct,
        object_id=obj_id,
    )
