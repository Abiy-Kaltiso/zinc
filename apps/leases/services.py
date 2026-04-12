from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.leases.models import Lease, LeaseAmendment, LeaseReview
from apps.leases.validators import (
    validate_amendment_term,
    validate_minimum_lease_term,
    validate_no_overlapping_active_lease,
)


class LeaseService:
    @staticmethod
    @transaction.atomic
    def submit_for_review(lease, user):
        if lease.status != Lease.Status.DRAFT:
            raise ValidationError("Only draft leases can be submitted for review.")
        if lease.owner != user and not user.is_board_member:
            raise ValidationError("You can only submit your own leases.")

        # Validate owner owns the unit
        if not lease.unit.ownerships.filter(owner=lease.owner, is_current=True).exists():
            raise ValidationError("The lease owner must be the current owner of the unit.")

        # Validate minimum lease term
        minimum_months = lease.unit.hoa_property.minimum_lease_term_months
        validate_minimum_lease_term(lease.lease_start_date, lease.lease_end_date, minimum_months)

        # Check no overlapping active lease
        validate_no_overlapping_active_lease(
            lease.unit, lease.lease_start_date, lease.lease_end_date, exclude_lease_id=lease.pk
        )

        # Create screening record
        from apps.screening.models import ScreeningChecklist, ScreeningCheckResult, ScreeningRecord

        screening_record, _ = ScreeningRecord.objects.get_or_create(lease=lease)
        checklist_items = ScreeningChecklist.objects.filter(hoa_property=lease.unit.hoa_property)
        for item in checklist_items:
            ScreeningCheckResult.objects.get_or_create(
                screening=screening_record,
                checklist_item=item,
            )

        # Transition status
        lease.status = Lease.Status.PENDING_REVIEW
        lease.submitted_at = timezone.now()
        lease.save()

        return lease

    @staticmethod
    @transaction.atomic
    def review_lease(lease, reviewer, decision, comments=""):
        if lease.status != Lease.Status.PENDING_REVIEW:
            raise ValidationError("Only pending leases can be reviewed.")
        if not reviewer.is_board_member:
            raise ValidationError("Only board members can review leases.")

        # Create review record
        review = LeaseReview.objects.create(
            lease=lease,
            reviewer=reviewer,
            decision=decision,
            comments=comments,
        )

        if decision == LeaseReview.Decision.APPROVED:
            # Check screening requirements
            prop = lease.unit.hoa_property
            if prop.require_screening_for_approval:
                screening = getattr(lease, "screening", None)
                if not screening or not screening.all_checks_completed:
                    raise ValidationError(
                        "All screening checks must be completed before approval. "
                        "Please verify tenant screening first."
                    )

            lease.status = Lease.Status.APPROVED
            lease.approved_at = timezone.now()
        elif decision == LeaseReview.Decision.DENIED:
            lease.status = Lease.Status.DENIED
            lease.denied_at = timezone.now()
        elif decision == LeaseReview.Decision.RETURNED:
            lease.status = Lease.Status.DRAFT

        lease.save()
        return review

    @staticmethod
    @transaction.atomic
    def activate_lease(lease, user):
        if lease.status != Lease.Status.APPROVED:
            raise ValidationError("Only approved leases can be activated.")

        lease.status = Lease.Status.ACTIVE
        lease.activated_at = timezone.now()
        lease.save()

        # Update unit occupancy status
        lease.unit.occupancy_status = "rented"
        lease.unit.save()

        return lease

    @staticmethod
    @transaction.atomic
    def terminate_lease(lease, user, reason=""):
        if lease.status not in (Lease.Status.ACTIVE, Lease.Status.APPROVED):
            raise ValidationError("Only active or approved leases can be terminated.")

        lease.status = Lease.Status.TERMINATED
        lease.terminated_at = timezone.now()
        lease.save()

        # Check if there are other active leases on this unit
        other_active = Lease.objects.filter(
            unit=lease.unit,
            status=Lease.Status.ACTIVE,
        ).exclude(pk=lease.pk).exists()

        if not other_active:
            lease.unit.occupancy_status = "owner_occupied"
            lease.unit.save()

        return lease

    @staticmethod
    @transaction.atomic
    def request_amendment(lease, user, new_end_date=None, new_monthly_rent=None, reason=""):
        if lease.status != Lease.Status.ACTIVE:
            raise ValidationError("Only active leases can be amended.")

        amendment = LeaseAmendment(
            lease=lease,
            amended_by=user,
            reason=reason,
        )

        requires_approval = False

        if new_end_date:
            # Validate against minimum term
            minimum_months = lease.unit.hoa_property.minimum_lease_term_months
            validate_amendment_term(lease, new_end_date, minimum_months)

            amendment.previous_end_date = lease.lease_end_date
            amendment.new_end_date = new_end_date

            # If shortening the term, require board approval
            if new_end_date < lease.lease_end_date:
                requires_approval = True

        if new_monthly_rent is not None:
            amendment.previous_monthly_rent = lease.monthly_rent
            amendment.new_monthly_rent = new_monthly_rent

        amendment.requires_board_approval = requires_approval
        amendment.save()

        # Auto-apply if no board approval needed
        if not requires_approval:
            amendment.approved = True
            amendment.save()
            LeaseService._apply_amendment(lease, amendment)

        return amendment

    @staticmethod
    @transaction.atomic
    def approve_amendment(amendment, approver):
        if not amendment.requires_board_approval:
            raise ValidationError("This amendment does not require board approval.")
        if amendment.approved is not None:
            raise ValidationError("This amendment has already been decided.")

        amendment.approved = True
        amendment.approved_by = approver
        amendment.approved_at = timezone.now()
        amendment.save()

        LeaseService._apply_amendment(amendment.lease, amendment)
        return amendment

    @staticmethod
    def _apply_amendment(lease, amendment):
        if amendment.new_end_date:
            lease.lease_end_date = amendment.new_end_date
        if amendment.new_monthly_rent is not None:
            lease.monthly_rent = amendment.new_monthly_rent
        lease.save()
