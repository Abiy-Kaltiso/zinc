from rest_framework import serializers

from apps.leases.models import Lease, LeaseAmendment, LeaseReview


class LeaseSerializer(serializers.ModelSerializer):
    tenant_full_name = serializers.ReadOnlyField()
    term_months = serializers.ReadOnlyField()
    days_until_expiration = serializers.ReadOnlyField()
    unit_number = serializers.CharField(source="unit.unit_number", read_only=True)
    owner_name = serializers.CharField(source="owner.get_full_name", read_only=True)

    class Meta:
        model = Lease
        fields = [
            "id", "unit", "unit_number", "owner", "owner_name",
            "tenant_first_name", "tenant_last_name", "tenant_full_name",
            "tenant_email", "tenant_phone",
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
    class Meta:
        model = Lease
        fields = [
            "id", "unit", "tenant_first_name", "tenant_last_name",
            "tenant_email", "tenant_phone",
            "lease_start_date", "lease_end_date", "monthly_rent", "lease_terms",
        ]
        read_only_fields = ["id"]

    def validate(self, data):
        if data["lease_end_date"] <= data["lease_start_date"]:
            raise serializers.ValidationError("Lease end date must be after the start date.")
        return data


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
