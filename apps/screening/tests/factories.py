import factory

from apps.leases.tests.factories import LeaseFactory
from apps.properties.tests.factories import PropertyFactory
from apps.screening.models import ScreeningChecklist, ScreeningCheckResult, ScreeningRecord


class ScreeningChecklistFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ScreeningChecklist

    hoa_property = factory.SubFactory(PropertyFactory)
    name = factory.Iterator(["Credit Check", "Background Check", "Eviction History", "Employment Verification"])
    is_required = True
    order = factory.Sequence(lambda n: n)


class ScreeningRecordFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ScreeningRecord

    lease = factory.SubFactory(LeaseFactory)


class ScreeningCheckResultFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ScreeningCheckResult

    screening = factory.SubFactory(ScreeningRecordFactory)
    checklist_item = factory.SubFactory(ScreeningChecklistFactory)
    status = "pending"
