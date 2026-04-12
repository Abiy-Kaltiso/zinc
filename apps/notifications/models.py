from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        LEASE_SUBMITTED = "lease_submitted", "Lease Submitted"
        LEASE_APPROVED = "lease_approved", "Lease Approved"
        LEASE_DENIED = "lease_denied", "Lease Denied"
        LEASE_RETURNED = "lease_returned", "Lease Returned for Revision"
        LEASE_EXPIRING = "lease_expiring", "Lease Expiring"
        LEASE_EXPIRED = "lease_expired", "Lease Expired"
        LEASE_ACTIVATED = "lease_activated", "Lease Activated"
        SCREENING_REQUIRED = "screening_required", "Screening Required"
        DOCUMENT_UPLOADED = "document_uploaded", "Document Uploaded"
        AMENDMENT_REQUESTED = "amendment_requested", "Amendment Requested"
        AMENDMENT_APPROVED = "amendment_approved", "Amendment Approved"

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")

    is_read = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
        ]

    def __str__(self):
        return f"{self.title} -> {self.recipient}"


class CommunicationLog(models.Model):
    lease = models.ForeignKey("leases.Lease", on_delete=models.CASCADE, related_name="communications")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_communications")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message from {self.sender} on Lease #{self.lease_id}"
