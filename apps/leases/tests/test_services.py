import pytest
from datetime import date, timedelta

from rest_framework.exceptions import ValidationError

from apps.accounts.tests.factories import BoardMemberFactory, UserFactory
from apps.leases.models import Lease
from apps.leases.services import LeaseService
from apps.leases.tests.factories import LeaseFactory
from apps.properties.tests.factories import PropertyFactory, UnitFactory, UnitOwnershipFactory


@pytest.mark.django_db
class TestLeaseSubmission:
    def test_submit_for_review(self):
        owner = UserFactory()
        prop = PropertyFactory(minimum_lease_term_months=6)
        unit = UnitFactory(hoa_property=prop)
        UnitOwnershipFactory(unit=unit, owner=owner)
        lease = LeaseFactory(
            unit=unit, owner=owner,
            lease_start_date=date.today(),
            lease_end_date=date.today() + timedelta(days=365),
        )
        result = LeaseService.submit_for_review(lease, owner)
        assert result.status == Lease.Status.PENDING_REVIEW
        assert result.submitted_at is not None

    def test_submit_below_minimum_term(self):
        owner = UserFactory()
        prop = PropertyFactory(minimum_lease_term_months=12)
        unit = UnitFactory(hoa_property=prop)
        UnitOwnershipFactory(unit=unit, owner=owner)
        lease = LeaseFactory(
            unit=unit, owner=owner,
            lease_start_date=date.today(),
            lease_end_date=date.today() + timedelta(days=90),  # ~3 months
        )
        with pytest.raises(ValidationError, match="minimum"):
            LeaseService.submit_for_review(lease, owner)

    def test_submit_without_ownership(self):
        owner = UserFactory()
        unit = UnitFactory()
        lease = LeaseFactory(unit=unit, owner=owner)
        with pytest.raises(ValidationError, match="current owner"):
            LeaseService.submit_for_review(lease, owner)

    def test_submit_non_draft_fails(self):
        owner = UserFactory()
        prop = PropertyFactory()
        unit = UnitFactory(hoa_property=prop)
        UnitOwnershipFactory(unit=unit, owner=owner)
        lease = LeaseFactory(unit=unit, owner=owner, status=Lease.Status.ACTIVE)
        with pytest.raises(ValidationError, match="draft"):
            LeaseService.submit_for_review(lease, owner)


@pytest.mark.django_db
class TestLeaseReview:
    def _create_pending_lease(self):
        owner = UserFactory()
        prop = PropertyFactory(require_screening_for_approval=False)
        unit = UnitFactory(hoa_property=prop)
        UnitOwnershipFactory(unit=unit, owner=owner)
        lease = LeaseFactory(
            unit=unit, owner=owner,
            lease_start_date=date.today(),
            lease_end_date=date.today() + timedelta(days=365),
        )
        LeaseService.submit_for_review(lease, owner)
        return lease

    def test_approve_lease(self):
        lease = self._create_pending_lease()
        board = BoardMemberFactory()
        review = LeaseService.review_lease(lease, board, "approved", "Looks good")
        lease.refresh_from_db()
        assert lease.status == Lease.Status.APPROVED
        assert review.decision == "approved"

    def test_deny_lease(self):
        lease = self._create_pending_lease()
        board = BoardMemberFactory()
        LeaseService.review_lease(lease, board, "denied", "Missing docs")
        lease.refresh_from_db()
        assert lease.status == Lease.Status.DENIED

    def test_return_lease(self):
        lease = self._create_pending_lease()
        board = BoardMemberFactory()
        LeaseService.review_lease(lease, board, "returned", "Please fix dates")
        lease.refresh_from_db()
        assert lease.status == Lease.Status.DRAFT


@pytest.mark.django_db
class TestLeaseActivation:
    def test_activate_approved_lease(self):
        owner = UserFactory()
        prop = PropertyFactory(require_screening_for_approval=False)
        unit = UnitFactory(hoa_property=prop)
        UnitOwnershipFactory(unit=unit, owner=owner)
        lease = LeaseFactory(
            unit=unit, owner=owner,
            lease_start_date=date.today(),
            lease_end_date=date.today() + timedelta(days=365),
        )
        LeaseService.submit_for_review(lease, owner)
        board = BoardMemberFactory()
        LeaseService.review_lease(lease, board, "approved")
        lease = LeaseService.activate_lease(lease, board)
        assert lease.status == Lease.Status.ACTIVE
        unit.refresh_from_db()
        assert unit.occupancy_status == "rented"


@pytest.mark.django_db
class TestLeaseTermination:
    def test_terminate_active_lease(self):
        owner = UserFactory()
        prop = PropertyFactory(require_screening_for_approval=False)
        unit = UnitFactory(hoa_property=prop)
        UnitOwnershipFactory(unit=unit, owner=owner)
        lease = LeaseFactory(
            unit=unit, owner=owner,
            lease_start_date=date.today(),
            lease_end_date=date.today() + timedelta(days=365),
        )
        LeaseService.submit_for_review(lease, owner)
        board = BoardMemberFactory()
        LeaseService.review_lease(lease, board, "approved")
        LeaseService.activate_lease(lease, board)
        lease = LeaseService.terminate_lease(lease, board)
        assert lease.status == Lease.Status.TERMINATED
        unit.refresh_from_db()
        assert unit.occupancy_status == "owner_occupied"
