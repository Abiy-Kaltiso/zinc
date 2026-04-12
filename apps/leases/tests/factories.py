import factory
from datetime import date, timedelta

from apps.accounts.tests.factories import UserFactory
from apps.leases.models import Lease, LeaseReview
from apps.properties.tests.factories import UnitFactory


class LeaseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Lease

    unit = factory.SubFactory(UnitFactory)
    owner = factory.SubFactory(UserFactory)
    tenant_first_name = factory.Faker("first_name")
    tenant_last_name = factory.Faker("last_name")
    tenant_email = factory.Faker("email")
    tenant_phone = factory.Faker("phone_number")
    lease_start_date = factory.LazyFunction(date.today)
    lease_end_date = factory.LazyFunction(lambda: date.today() + timedelta(days=365))
    monthly_rent = factory.Faker("pydecimal", left_digits=4, right_digits=2, positive=True)
    status = Lease.Status.DRAFT


class LeaseReviewFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LeaseReview

    lease = factory.SubFactory(LeaseFactory)
    reviewer = factory.SubFactory(UserFactory, role="board_member")
    decision = LeaseReview.Decision.APPROVED
    comments = "Looks good."
