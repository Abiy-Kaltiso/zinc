from django.conf import settings
from django.db import models


class Property(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    minimum_lease_term_months = models.PositiveIntegerField(
        default=12,
        help_text="Minimum lease duration in months",
    )
    require_screening_for_approval = models.BooleanField(
        default=True,
        help_text="Require completed screening before lease can be approved",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "properties"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Unit(models.Model):
    class OccupancyStatus(models.TextChoices):
        OWNER_OCCUPIED = "owner_occupied", "Owner Occupied"
        RENTED = "rented", "Rented"
        VACANT = "vacant", "Vacant"

    hoa_property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="units", db_column="property_id")
    unit_number = models.CharField(max_length=20)
    address_line = models.CharField(max_length=255, blank=True)
    bedrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    bathrooms = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    square_feet = models.PositiveIntegerField(null=True, blank=True)
    occupancy_status = models.CharField(
        max_length=20,
        choices=OccupancyStatus.choices,
        default=OccupancyStatus.OWNER_OCCUPIED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("hoa_property", "unit_number")]
        ordering = ["unit_number"]

    def __str__(self):
        return f"Unit {self.unit_number} - {self.hoa_property.name}"

    @property
    def current_owner(self):
        ownership = self.ownerships.filter(is_current=True).select_related("owner").first()
        return ownership.owner if ownership else None


class UnitOwnership(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="ownerships")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ownerships")
    is_current = models.BooleanField(default=True)
    acquired_date = models.DateField()
    disposed_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["owner", "is_current"]),
            models.Index(fields=["unit", "is_current"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["unit"],
                condition=models.Q(is_current=True),
                name="unique_current_owner_per_unit",
            )
        ]

    def __str__(self):
        return f"{self.owner} owns {self.unit}"
