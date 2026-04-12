import pytest

from apps.properties.tests.factories import PropertyFactory, UnitFactory, UnitOwnershipFactory


@pytest.mark.django_db
class TestPropertyModel:
    def test_create_property(self):
        prop = PropertyFactory(name="Sunset Heights HOA")
        assert prop.name == "Sunset Heights HOA"
        assert prop.minimum_lease_term_months == 12
        assert prop.require_screening_for_approval is True

    def test_str_representation(self):
        prop = PropertyFactory(name="Test HOA")
        assert str(prop) == "Test HOA"


@pytest.mark.django_db
class TestUnitModel:
    def test_create_unit(self):
        unit = UnitFactory(unit_number="101A")
        assert unit.unit_number == "101A"

    def test_current_owner(self):
        ownership = UnitOwnershipFactory()
        assert ownership.unit.current_owner == ownership.owner

    def test_no_current_owner(self):
        unit = UnitFactory()
        assert unit.current_owner is None

    def test_unique_unit_per_property(self):
        unit = UnitFactory(unit_number="101")
        with pytest.raises(Exception):
            UnitFactory(unit_number="101", hoa_property=unit.hoa_property)


@pytest.mark.django_db
class TestUnitOwnershipModel:
    def test_create_ownership(self):
        ownership = UnitOwnershipFactory()
        assert ownership.is_current is True
        assert ownership.disposed_date is None
