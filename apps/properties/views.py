from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsBoardMember
from apps.properties.models import Property, Unit, UnitOwnership
from apps.properties.serializers import (
    PropertySerializer,
    UnitDetailSerializer,
    UnitOwnershipSerializer,
    UnitSerializer,
)


class PropertyListView(generics.ListCreateAPIView):
    serializer_class = PropertySerializer
    queryset = Property.objects.all()

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsBoardMember()]
        return [IsAuthenticated()]


class PropertyDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PropertySerializer
    queryset = Property.objects.all()

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH"):
            return [IsBoardMember()]
        return [IsAuthenticated()]


class UnitListView(generics.ListCreateAPIView):
    serializer_class = UnitSerializer
    filterset_fields = ["occupancy_status"]
    search_fields = ["unit_number", "address_line"]

    def get_queryset(self):
        return Unit.objects.filter(hoa_property_id=self.kwargs["property_pk"]).select_related("hoa_property")

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsBoardMember()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(hoa_property_id=self.kwargs["property_pk"])


class UnitDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UnitDetailSerializer
    queryset = Unit.objects.select_related("hoa_property").prefetch_related("ownerships__owner")

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH"):
            return [IsBoardMember()]
        return [IsAuthenticated()]


class UnitOwnershipListCreateView(generics.ListCreateAPIView):
    serializer_class = UnitOwnershipSerializer
    permission_classes = [IsBoardMember]

    def get_queryset(self):
        return UnitOwnership.objects.filter(unit_id=self.kwargs["unit_pk"]).select_related("owner")

    def perform_create(self, serializer):
        unit_id = self.kwargs["unit_pk"]
        # Mark previous current ownership as not current
        UnitOwnership.objects.filter(unit_id=unit_id, is_current=True).update(is_current=False)
        serializer.save(unit_id=unit_id, is_current=True)


class MyUnitsView(generics.ListAPIView):
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Unit.objects.filter(
            ownerships__owner=self.request.user,
            ownerships__is_current=True,
        ).select_related("hoa_property")
