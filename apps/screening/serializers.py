from rest_framework import serializers

from apps.screening.models import ScreeningChecklist, ScreeningCheckResult, ScreeningRecord


class ScreeningChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScreeningChecklist
        fields = ["id", "hoa_property", "name", "description", "is_required", "order"]
        read_only_fields = ["id"]


class ScreeningCheckResultSerializer(serializers.ModelSerializer):
    checklist_item_name = serializers.CharField(source="checklist_item.name", read_only=True)
    is_required = serializers.BooleanField(source="checklist_item.is_required", read_only=True)

    class Meta:
        model = ScreeningCheckResult
        fields = ["id", "checklist_item", "checklist_item_name", "is_required", "status", "completed_at", "notes"]
        read_only_fields = ["id", "checklist_item"]


class ScreeningRecordSerializer(serializers.ModelSerializer):
    check_results = ScreeningCheckResultSerializer(many=True, read_only=True)
    verified_by_name = serializers.CharField(source="verified_by.get_full_name", read_only=True, default=None)

    class Meta:
        model = ScreeningRecord
        fields = [
            "id", "lease", "all_checks_completed",
            "verified_by", "verified_by_name", "verified_at",
            "notes", "check_results",
            "owner_attested", "attestation_company", "attestation_date", "owner_attested_at",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "lease", "all_checks_completed",
            "verified_by", "verified_at",
            "owner_attested", "owner_attested_at",
            "created_at",
        ]
