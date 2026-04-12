import factory
from datetime import date, timedelta

from apps.accounts.tests.factories import UserFactory
from apps.leases.models import Lease, LeaseReview, Tenant


class LeaseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Lease

    unit_number = factory.Sequence(lambda n: f"{100 + n}")
    owner = factory.SubFactory(UserFactory)
    lease_start_date = factory.LazyFunction(date.today)
    lease_end_date = factory.LazyFunction(lambda: date.today() + timedelta(days=365))
    monthly_rent = factory.Faker("pydecimal", left_digits=4, right_digits=2, positive=True)
    status = Lease.Status.DRAFT


class TenantFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tenant

    lease = factory.SubFactory(LeaseFactory)
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    email = factory.Faker("email")
    phone = factory.Faker("phone_number")


class LeaseReviewFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LeaseReview

    lease = factory.SubFactory(LeaseFactory)
    reviewer = factory.SubFactory(UserFactory, role="board_member")
    decision = LeaseReview.Decision.APPROVED
    comments = "Looks good."
