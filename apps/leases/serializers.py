from rest_framework import serializers

from apps.leases.models import Lease, LeaseAmendment, LeaseReview, Tenant


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["id", "first_name", "last_name", "email", "phone"]
        read_only_fields = ["id"]


class LeaseSerializer(serializers.ModelSerializer):
    tenants = TenantSerializer(many=True, read_only=True)
    tenant_full_name = serializers.ReadOnlyField()
    term_months = serializers.ReadOnlyField()
    days_until_expiration = serializers.ReadOnlyField()
    owner_name = serializers.CharField(source="owner.get_full_name", read_only=True)

    class Meta:
        model = Lease
        fields = [
            "id", "unit_number", "owner", "owner_name",
            "tenants", "tenant_full_name",
            "lease_start_date", "lease_end_date", "monthly_rent", "lease_terms",
            "term_months", "days_until_expiration",
            "status", "submitted_at", "approved_at", "denied_at",
            "activated_at", "expired_at", "terminated_at",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "owner", "status", "submitted_at", "approved_at", "denied_at",
            "activated_at", "expired_at", "terminated_at", "created_at", "updated_at",
        ]


class LeaseCreateSerializer(serializers.ModelSerializer):
    tenants = TenantSerializer(many=True)

    class Meta:
        model = Lease
        fields = [
            "id", "unit_number", "tenants",
            "lease_start_date", "lease_end_date", "monthly_rent", "lease_terms",
        ]
        read_only_fields = ["id"]

    def validate(self, data):
        if data["lease_end_date"] <= data["lease_start_date"]:
            raise serializers.ValidationError("Lease end date must be after the start date.")
        if not data.get("tenants"):
            raise serializers.ValidationError("At least one tenant is required.")
        return data

    def create(self, validated_data):
        tenants_data = validated_data.pop("tenants", [])
        lease = Lease.objects.create(**validated_data)
        for tenant_data in tenants_data:
            Tenant.objects.create(lease=lease, **tenant_data)
        return lease


class LeaseReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.get_full_name", read_only=True)

    class Meta:
        model = LeaseReview
        fields = ["id", "lease", "reviewer", "reviewer_name", "decision", "comments", "created_at"]
        read_only_fields = ["id", "lease", "reviewer", "created_at"]


class LeaseReviewCreateSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=LeaseReview.Decision.choices)
    comments = serializers.CharField(required=False, allow_blank=True, default="")


class LeaseAmendmentSerializer(serializers.ModelSerializer):
    amended_by_name = serializers.CharField(source="amended_by.get_full_name", read_only=True)

    class Meta:
        model = LeaseAmendment
        fields = [
            "id", "lease", "amended_by", "amended_by_name",
            "previous_end_date", "new_end_date",
            "previous_monthly_rent", "new_monthly_rent",
            "reason", "requires_board_approval", "approved",
            "approved_by", "approved_at", "created_at",
        ]
        read_only_fields = [
            "id", "lease", "amended_by", "requires_board_approval",
            "approved", "approved_by", "approved_at", "created_at",
        ]


class LeaseAmendmentCreateSerializer(serializers.Serializer):
    new_end_date = serializers.DateField(required=False)
    new_monthly_rent = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    reason = serializers.CharField()
