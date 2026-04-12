from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.properties.models import Property, Unit, UnitOwnership

User = get_user_model()


class PropertySerializer(serializers.ModelSerializer):
    unit_count = serializers.IntegerField(source="units.count", read_only=True)

    class Meta:
        model = Property
        fields = [
            "id", "name", "address", "minimum_lease_term_months",
            "require_screening_for_approval", "unit_count", "created_at", "updated_at",
        ]


class UnitOwnershipSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source="owner.get_full_name", read_only=True)
    owner_email = serializers.EmailField(source="owner.email", read_only=True)

    class Meta:
        model = UnitOwnership
        fields = [
            "id", "unit", "owner", "owner_name", "owner_email",
            "is_current", "acquired_date", "disposed_date", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class UnitSerializer(serializers.ModelSerializer):
    current_owner_name = serializers.SerializerMethodField()
    property_name = serializers.CharField(source="hoa_property.name", read_only=True)

    class Meta:
        model = Unit
        fields = [
            "id", "hoa_property", "property_name", "unit_number", "address_line",
            "bedrooms", "bathrooms", "square_feet", "occupancy_status",
            "current_owner_name", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_current_owner_name(self, obj):
        owner = obj.current_owner
        return owner.get_full_name() if owner else None


class UnitDetailSerializer(UnitSerializer):
    ownerships = UnitOwnershipSerializer(many=True, read_only=True)

    class Meta(UnitSerializer.Meta):
        fields = UnitSerializer.Meta.fields + ["ownerships"]
