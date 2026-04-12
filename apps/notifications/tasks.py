from datetime import date, timedelta

from celery import shared_task
from django.utils import timezone


@shared_task
def check_expiring_leases():
    from apps.leases.models import Lease
    from apps.notifications.services import notify_board_members, notify_user

    today = date.today()
    for days in [90, 60, 30]:
        target_date = today + timedelta(days=days)
        expiring = Lease.objects.filter(
            status=Lease.Status.ACTIVE,
            lease_end_date=target_date,
        ).select_related("owner")

        for lease in expiring:
            title = f"Lease expiring in {days} days"
            message = (
                f"Lease for Unit {lease.unit_number} "
                f"(Tenant: {lease.tenant_full_name}) "
                f"expires on {lease.lease_end_date}."
            )
            notify_user(lease.owner, "lease_expiring", title, message, lease)
            notify_board_members("lease_expiring", title, message, lease)


@shared_task
def auto_expire_leases():
    from apps.leases.models import Lease
    from apps.notifications.services import notify_board_members, notify_user

    today = date.today()
    expired_leases = Lease.objects.filter(
        status=Lease.Status.ACTIVE,
        lease_end_date__lt=today,
    ).select_related("owner")

    for lease in expired_leases:
        lease.status = Lease.Status.EXPIRED
        lease.expired_at = timezone.now()
        lease.save()

        title = "Lease expired"
        message = (
            f"The lease for Unit {lease.unit_number} "
            f"(Tenant: {lease.tenant_full_name}) has expired."
        )
        notify_user(lease.owner, "lease_expired", title, message, lease)
        notify_board_members("lease_expired", title, message, lease)
