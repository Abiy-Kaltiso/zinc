from dateutil.relativedelta import relativedelta
from rest_framework.exceptions import ValidationError


def validate_minimum_lease_term(lease_start, lease_end, minimum_months):
    delta = relativedelta(lease_end, lease_start)
    term_months = delta.years * 12 + delta.months
    if term_months < minimum_months:
        raise ValidationError(
            f"Lease term of {term_months} months is below the community minimum of {minimum_months} months."
        )


def validate_no_overlapping_active_lease(unit, lease_start, lease_end, exclude_lease_id=None):
    from apps.leases.models import Lease

    overlapping = Lease.objects.filter(
        unit=unit,
        status__in=[Lease.Status.ACTIVE, Lease.Status.APPROVED, Lease.Status.PENDING_REVIEW],
        lease_start_date__lt=lease_end,
        lease_end_date__gt=lease_start,
    )
    if exclude_lease_id:
        overlapping = overlapping.exclude(pk=exclude_lease_id)
    if overlapping.exists():
        raise ValidationError("There is already an active or pending lease for this unit during the specified dates.")


def validate_amendment_term(lease, new_end_date, minimum_months):
    delta = relativedelta(new_end_date, lease.lease_start_date)
    term_months = delta.years * 12 + delta.months
    if term_months < minimum_months:
        raise ValidationError(
            f"Amended lease term of {term_months} months would be below "
            f"the community minimum of {minimum_months} months."
        )
