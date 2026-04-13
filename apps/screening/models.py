from django.conf import settings
from django.db import models


class ScreeningChecklist(models.Model):
    hoa_property = models.ForeignKey("properties.Property", on_delete=models.CASCADE, related_name="screening_items", db_column="property_id")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_required = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name


class ScreeningRecord(models.Model):
    lease = models.OneToOneField("leases.Lease", on_delete=models.CASCADE, related_name="screening")
    all_checks_completed = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_screenings",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    # Owner attestation fields
    owner_attested = models.BooleanField(default=False)
    attestation_company = models.CharField(max_length=200, blank=True)
    attestation_date = models.DateField(null=True, blank=True)
    owner_attested_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Screening for Lease #{self.lease_id}"

    def update_completion_status(self):
        required_checks = self.check_results.filter(checklist_item__is_required=True)
        all_done = not required_checks.filter(status=ScreeningCheckResult.Status.PENDING).exists()
        self.all_checks_completed = all_done
        self.save(update_fields=["all_checks_completed", "updated_at"])


class ScreeningCheckResult(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        WAIVED = "waived", "Waived"

    screening = models.ForeignKey(ScreeningRecord, on_delete=models.CASCADE, related_name="check_results")
    checklist_item = models.ForeignKey(ScreeningChecklist, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = [("screening", "checklist_item")]

    def __str__(self):
        return f"{self.checklist_item.name} - {self.get_status_display()}"
