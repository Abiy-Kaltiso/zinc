from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsBoardMember, IsBoardMemberOrLeaseOwner
from apps.leases.models import Lease, LeaseAmendment, LeaseReview
from apps.leases.serializers import (
    LeaseAmendmentCreateSerializer,
    LeaseAmendmentSerializer,
    LeaseCreateSerializer,
    LeaseReviewCreateSerializer,
    LeaseReviewSerializer,
    LeaseSerializer,
)
from apps.leases.services import LeaseService


class LeaseListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "unit_number", "owner"]
    search_fields = ["unit_number", "tenants__first_name", "tenants__last_name"]
    ordering_fields = ["created_at", "lease_start_date", "lease_end_date", "status"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return LeaseCreateSerializer
        return LeaseSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Lease.objects.select_related("owner").prefetch_related("tenants")
        if user.is_board_member:
            return qs
        return qs.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class LeaseDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = LeaseSerializer
    permission_classes = [IsAuthenticated, IsBoardMemberOrLeaseOwner]
    queryset = Lease.objects.select_related("owner").prefetch_related("tenants")

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return LeaseCreateSerializer
        return LeaseSerializer

    def perform_update(self, serializer):
        lease = self.get_object()
        if lease.status != Lease.Status.DRAFT:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Only draft leases can be edited.")
        serializer.save()


class LeaseSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        lease = Lease.objects.get(pk=pk)
        lease = LeaseService.submit_for_review(lease, request.user)
        return Response(LeaseSerializer(lease).data)


class LeaseReviewView(APIView):
    permission_classes = [IsBoardMember]

    def post(self, request, pk):
        lease = Lease.objects.get(pk=pk)
        serializer = LeaseReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = LeaseService.review_lease(
            lease,
            request.user,
            serializer.validated_data["decision"],
            serializer.validated_data.get("comments", ""),
        )
        return Response(LeaseReviewSerializer(review).data)


class LeaseActivateView(APIView):
    permission_classes = [IsBoardMember]

    def post(self, request, pk):
        lease = Lease.objects.get(pk=pk)
        lease = LeaseService.activate_lease(lease, request.user)
        return Response(LeaseSerializer(lease).data)


class LeaseTerminateView(APIView):
    permission_classes = [IsBoardMember]

    def post(self, request, pk):
        lease = Lease.objects.get(pk=pk)
        reason = request.data.get("reason", "")
        lease = LeaseService.terminate_lease(lease, request.user, reason)
        return Response(LeaseSerializer(lease).data)


class LeaseReviewListView(generics.ListAPIView):
    serializer_class = LeaseReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LeaseReview.objects.filter(lease_id=self.kwargs["pk"]).select_related("reviewer")


class LeaseAmendmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return LeaseAmendmentCreateSerializer
        return LeaseAmendmentSerializer

    def get_queryset(self):
        return LeaseAmendment.objects.filter(lease_id=self.kwargs["pk"]).select_related("amended_by")

    def create(self, request, pk):
        lease = Lease.objects.get(pk=pk)
        serializer = LeaseAmendmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amendment = LeaseService.request_amendment(
            lease,
            request.user,
            new_end_date=serializer.validated_data.get("new_end_date"),
            new_monthly_rent=serializer.validated_data.get("new_monthly_rent"),
            reason=serializer.validated_data["reason"],
        )
        return Response(LeaseAmendmentSerializer(amendment).data, status=status.HTTP_201_CREATED)


class LeaseAmendmentApproveView(APIView):
    permission_classes = [IsBoardMember]

    def post(self, request, pk, amendment_pk):
        amendment = LeaseAmendment.objects.get(pk=amendment_pk, lease_id=pk)
        amendment = LeaseService.approve_amendment(amendment, request.user)
        return Response(LeaseAmendmentSerializer(amendment).data)


class LeaseExpiringView(generics.ListAPIView):
    serializer_class = LeaseSerializer
    permission_classes = [IsBoardMember]

    def get_queryset(self):
        from datetime import date, timedelta

        days = int(self.request.query_params.get("days", 90))
        target_date = date.today() + timedelta(days=days)
        return Lease.objects.filter(
            status=Lease.Status.ACTIVE,
            lease_end_date__lte=target_date,
            lease_end_date__gte=date.today(),
        ).select_related("owner").prefetch_related("tenants")
