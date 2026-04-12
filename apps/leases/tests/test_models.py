import pytest
from datetime import date, timedelta

from apps.leases.tests.factories import LeaseFactory


@pytest.mark.django_db
class TestLeaseModel:
    def test_create_lease(self):
        lease = LeaseFactory()
        assert lease.status == "draft"
        assert lease.pk is not None

    def test_tenant_full_name(self):
        lease = LeaseFactory(tenant_first_name="John", tenant_last_name="Doe")
        assert lease.tenant_full_name == "John Doe"

    def test_term_months(self):
        lease = LeaseFactory(
            lease_start_date=date(2025, 1, 1),
            lease_end_date=date(2026, 1, 1),
        )
        assert lease.term_months == 12

    def test_days_until_expiration(self):
        lease = LeaseFactory(lease_end_date=date.today() + timedelta(days=30))
        assert lease.days_until_expiration == 30

    def test_str_representation(self):
        lease = LeaseFactory()
        assert f"Lease #{lease.pk}" in str(lease)
