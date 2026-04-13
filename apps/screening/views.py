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
        return ScreeningRecord.objects.prefetch_related(
            "check_results__checklist_item"
        ).get(lease_id=self.kwargs["lease_pk"])


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
        screening.update_completion_status()
        return Response(ScreeningRecordSerializer(screening).data)
