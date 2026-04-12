from django.conf import settings
from django.db import models


class Lease(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_REVIEW = "pending_review", "Pending Review"
        APPROVED = "approved", "Approved"
        ACTIVE = "active", "Active"
        DENIED = "denied", "Denied"
        EXPIRED = "expired", "Expired"
        TERMINATED = "terminated", "Terminated"

    unit_number = models.CharField(max_length=50, default="", help_text="Unit number (e.g., 101, 2A)")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="leases")

    # Lease terms
    lease_start_date = models.DateField()
    lease_end_date = models.DateField()
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    lease_terms = models.TextField(blank=True, help_text="Summary of key lease terms")

    # Status tracking
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    denied_at = models.DateTimeField(null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    expired_at = models.DateTimeField(null=True, blank=True)
    terminated_at = models.DateTimeField(null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["lease_end_date"]),
            models.Index(fields=["unit_number", "status"]),
            models.Index(fields=["owner", "status"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(lease_end_date__gt=models.F("lease_start_date")),
                name="lease_end_after_start",
            )
        ]

    def __str__(self):
        return f"Lease #{self.pk} - Unit {self.unit_number} ({self.get_status_display()})"

    @property
    def tenant_full_name(self):
        first_tenant = self.tenants.first()
        return first_tenant.full_name if first_tenant else ""

    @property
    def term_months(self):
        from dateutil.relativedelta import relativedelta

        delta = relativedelta(self.lease_end_date, self.lease_start_date)
        return delta.years * 12 + delta.months

    @property
    def days_until_expiration(self):
        from datetime import date

        if self.lease_end_date:
            return (self.lease_end_date - date.today()).days
        return None


class LeaseReview(models.Model):
    class Decision(models.TextChoices):
        APPROVED = "approved", "Approved"
        DENIED = "denied", "Denied"
        RETURNED = "returned", "Returned for Revision"

    lease = models.ForeignKey(Lease, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="lease_reviews")
    decision = models.CharField(max_length=20, choices=Decision.choices)
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Review by {self.reviewer} - {self.get_decision_display()}"


class LeaseAmendment(models.Model):
    lease = models.ForeignKey(Lease, on_delete=models.CASCADE, related_name="amendments")
    amended_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    previous_end_date = models.DateField(null=True, blank=True)
    new_end_date = models.DateField(null=True, blank=True)
    previous_monthly_rent = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    new_monthly_rent = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    reason = models.TextField()
    requires_board_approval = models.BooleanField(default=False)
    approved = models.BooleanField(null=True, default=None)  # None = pending, True = approved, False = denied
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_amendments",
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Amendment to Lease #{self.lease_id}"


class Tenant(models.Model):
    lease = models.ForeignKey(Lease, on_delete=models.CASCADE, related_name="tenants")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
