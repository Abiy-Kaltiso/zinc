from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsBoardMember
from apps.screening.models import ScreeningChecklist, ScreeningCheckResult, ScreeningRecord
from apps.screening.serializers import (
    ScreeningChecklistSerializer,
    ScreeningCheckResultSerializer,
    ScreeningRecordSerializer,
)


class ScreeningChecklistListCreateView(generics.ListCreateAPIView):
    serializer_class = ScreeningChecklistSerializer
    filterset_fields = ["hoa_property"]

    def get_queryset(self):
        return ScreeningChecklist.objects.all()

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsBoardMember()]
        return [IsAuthenticated()]


class ScreeningChecklistDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ScreeningChecklistSerializer
    permission_classes = [IsBoardMember]
    queryset = ScreeningChecklist.objects.all()


class LeaseScreeningView(generics.RetrieveAPIView):
    serializer_class = ScreeningRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        lease_pk = self.kwargs["lease_pk"]
        screening, _ = ScreeningRecord.objects.get_or_create(lease_id=lease_pk)
        return ScreeningRecord.objects.prefetch_related(
            "check_results__checklist_item"
        ).get(pk=screening.pk)


class ScreeningCheckUpdateView(generics.UpdateAPIView):
    serializer_class = ScreeningCheckResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ScreeningCheckResult.objects.filter(
            screening__lease_id=self.kwargs["lease_pk"]
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == ScreeningCheckResult.Status.COMPLETED:
            instance.completed_at = timezone.now()
            instance.save(update_fields=["completed_at"])
        instance.screening.update_completion_status()


class ScreeningVerifyView(APIView):
    permission_classes = [IsBoardMember]

    def post(self, request, lease_pk):
        screening = ScreeningRecord.objects.get(lease_id=lease_pk)
        screening.verified_by = request.user
        screening.verified_at = timezone.now()
        screening.all_checks_completed = True
        screening.save()
        return Response(ScreeningRecordSerializer(screening).data)


class ScreeningUnverifyView(APIView):
    permission_classes = [IsBoardMember]

    def post(self, request, lease_pk):
        screening = ScreeningRecord.objects.get(lease_id=lease_pk)
        screening.verified_by = None
        screening.verified_at = None
        screening.save(update_fields=["verified_by", "verified_at", "updated_at"])
        screening.update_completion_status()
        screening.refresh_from_db()
        return Response(ScreeningRecordSerializer(screening).data)


class ScreeningAttestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, lease_pk):
        screening, _ = ScreeningRecord.objects.get_or_create(lease_id=lease_pk)

        if screening.lease.owner_id != request.user.pk:
            return Response(
                {"detail": "Only the lease owner can submit the attestation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        confirmed = request.data.get("confirmed", False)
        if not confirmed:
            return Response(
                {"detail": "You must confirm the attestation to proceed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        company = request.data.get("company", "").strip()
        attestation_date = request.data.get("date") or None

        if not company:
            return Response(
                {"detail": "Screening company name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not attestation_date:
            return Response(
                {"detail": "Screening date is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        screening.owner_attested = True
        screening.attestation_company = company
        screening.attestation_date = attestation_date
        screening.owner_attested_at = timezone.now()
        screening.save(update_fields=[
            "owner_attested", "attestation_company", "attestation_date",
            "owner_attested_at", "updated_at",
        ])

        return Response(ScreeningRecordSerializer(screening).data)

    def delete(self, request, lease_pk):
        """Allow owner to retract their attestation."""
        screening, _ = ScreeningRecord.objects.get_or_create(lease_id=lease_pk)

        if screening.lease.owner_id != request.user.pk:
            return Response(
                {"detail": "Only the lease owner can retract the attestation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        screening.owner_attested = False
        screening.attestation_company = ""
        screening.attestation_date = None
        screening.owner_attested_at = None
        screening.save(update_fields=[
            "owner_attested", "attestation_company", "attestation_date",
            "owner_attested_at", "updated_at",
        ])

        return Response(ScreeningRecordSerializer(screening).data)
