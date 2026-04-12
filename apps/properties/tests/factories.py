import factory
from datetime import date

from apps.accounts.tests.factories import UserFactory
from apps.properties.models import Property, Unit, UnitOwnership


class PropertyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Property

    name = factory.Sequence(lambda n: f"HOA Community {n}")
    address = factory.Faker("address")
    minimum_lease_term_months = 12
    require_screening_for_approval = True


class UnitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Unit

    hoa_property = factory.SubFactory(PropertyFactory)
    unit_number = factory.Sequence(lambda n: f"{100 + n}")
    address_line = factory.LazyAttribute(lambda obj: f"{obj.unit_number} Main St")
    bedrooms = 2
    bathrooms = 2.0
    square_feet = 1200
    occupancy_status = "owner_occupied"


class UnitOwnershipFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UnitOwnership

    unit = factory.SubFactory(UnitFactory)
    owner = factory.SubFactory(UserFactory)
    is_current = True
    acquired_date = factory.LazyFunction(date.today)
