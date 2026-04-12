import pytest
from datetime import date, timedelta

from apps.leases.tests.factories import LeaseFactory, TenantFactory


@pytest.mark.django_db
class TestLeaseModel:
    def test_create_lease(self):
        lease = LeaseFactory()
        assert lease.status == "draft"
        assert lease.pk is not None

    def test_tenant_full_name_with_tenants(self):
        lease = LeaseFactory()
        TenantFactory(lease=lease, first_name="John", last_name="Doe")
        assert lease.tenant_full_name == "John Doe"

    def test_tenant_full_name_no_tenants(self):
        lease = LeaseFactory()
        assert lease.tenant_full_name == ""

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
        lease = LeaseFactory(unit_number="101A")
        assert "Unit 101A" in str(lease)

    def test_unit_number_stored(self):
        lease = LeaseFactory(unit_number="B-205")
        assert lease.unit_number == "B-205"


@pytest.mark.django_db
class TestTenantModel:
    def test_create_tenant(self):
        tenant = TenantFactory(first_name="Jane", last_name="Smith")
        assert tenant.full_name == "Jane Smith"

    def test_multiple_tenants_on_lease(self):
        lease = LeaseFactory()
        TenantFactory(lease=lease, first_name="A", last_name="One")
        TenantFactory(lease=lease, first_name="B", last_name="Two")
        assert lease.tenants.count() == 2
