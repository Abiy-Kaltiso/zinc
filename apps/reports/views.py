import csv
from datetime import date, timedelta
from io import StringIO

from django.db.models import Count, Q
from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsBoardMember
from apps.leases.models import Lease
from apps.leases.serializers import LeaseSerializer
from apps.properties.models import Unit


class DashboardView(APIView):
    permission_classes = [IsBoardMember]

    def get(self, request):
        today = date.today()
        thirty_days = today + timedelta(days=30)
        sixty_days = today + timedelta(days=60)
        ninety_days = today + timedelta(days=90)

        active_leases = Lease.objects.filter(status=Lease.Status.ACTIVE)
        pending_leases = Lease.objects.filter(status=Lease.Status.PENDING_REVIEW)

        occupancy = Unit.objects.aggregate(
            total=Count("id"),
            owner_occupied=Count("id", filter=Q(occupancy_status="owner_occupied")),
            rented=Count("id", filter=Q(occupancy_status="rented")),
            vacant=Count("id", filter=Q(occupancy_status="vacant")),
        )

        return Response({
            "active_leases": active_leases.count(),
            "pending_reviews": pending_leases.count(),
            "expiring_30_days": active_leases.filter(
                lease_end_date__lte=thirty_days, lease_end_date__gte=today
            ).count(),
            "expiring_60_days": active_leases.filter(
                lease_end_date__lte=sixty_days, lease_end_date__gte=today
            ).count(),
            "expiring_90_days": active_leases.filter(
                lease_end_date__lte=ninety_days, lease_end_date__gte=today
            ).count(),
            "occupancy": occupancy,
        })


class ActiveLeasesReportView(APIView):
    permission_classes = [IsBoardMember]

    def get(self, request):
        leases = Lease.objects.filter(
            status=Lease.Status.ACTIVE
        ).select_related("unit", "owner")

        # Optional filters
        unit_id = request.query_params.get("unit")
        if unit_id:
            leases = leases.filter(unit_id=unit_id)

        owner_id = request.query_params.get("owner")
        if owner_id:
            leases = leases.filter(owner_id=owner_id)

        serializer = LeaseSerializer(leases, many=True)
        return Response(serializer.data)


class ComplianceReportView(APIView):
    permission_classes = [IsBoardMember]

    def get(self, request):
        leases = Lease.objects.filter(
            status__in=[Lease.Status.ACTIVE, Lease.Status.PENDING_REVIEW, Lease.Status.APPROVED]
        ).select_related("unit", "owner")

        report = []
        for lease in leases:
            screening = getattr(lease, "screening", None)
            screening_complete = screening.all_checks_completed if screening else False
            screening_verified = screening.verified_at is not None if screening else False

            min_term = lease.unit.hoa_property.minimum_lease_term_months
            term_compliant = lease.term_months >= min_term

            doc_count = 0
            from django.contrib.contenttypes.models import ContentType
            from apps.documents.models import Document
            lease_ct = ContentType.objects.get_for_model(Lease)
            doc_count = Document.objects.filter(
                content_type=lease_ct, object_id=lease.pk, is_current_version=True
            ).count()

            report.append({
                "lease_id": lease.pk,
                "unit_number": lease.unit.unit_number,
                "tenant_name": lease.tenant_full_name,
                "owner_name": lease.owner.get_full_name(),
                "status": lease.status,
                "term_months": lease.term_months,
                "term_compliant": term_compliant,
                "screening_complete": screening_complete,
                "screening_verified": screening_verified,
                "document_count": doc_count,
            })
        return Response(report)


class ExpirationTimelineView(APIView):
    permission_classes = [IsBoardMember]

    def get(self, request):
        today = date.today()
        days = int(request.query_params.get("days", 180))
        target = today + timedelta(days=days)

        leases = Lease.objects.filter(
            status=Lease.Status.ACTIVE,
            lease_end_date__gte=today,
            lease_end_date__lte=target,
        ).select_related("unit", "owner").order_by("lease_end_date")

        serializer = LeaseSerializer(leases, many=True)
        return Response(serializer.data)


class OccupancyOverviewView(APIView):
    permission_classes = [IsBoardMember]

    def get(self, request):
        units = Unit.objects.select_related("hoa_property").all()
        data = []
        for unit in units:
            current_owner = unit.current_owner
            active_lease = unit.leases.filter(status=Lease.Status.ACTIVE).first()

            data.append({
                "unit_id": unit.pk,
                "unit_number": unit.unit_number,
                "property": unit.hoa_property.name,
                "occupancy_status": unit.occupancy_status,
                "owner_name": current_owner.get_full_name() if current_owner else None,
                "tenant_name": active_lease.tenant_full_name if active_lease else None,
                "lease_end_date": active_lease.lease_end_date if active_lease else None,
            })
        return Response(data)


class LeaseExportCSVView(APIView):
    permission_classes = [IsBoardMember]

    def get(self, request):
        leases = Lease.objects.filter(
            status__in=[Lease.Status.ACTIVE, Lease.Status.APPROVED, Lease.Status.PENDING_REVIEW]
        ).select_related("unit", "owner")

        output = StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Lease ID", "Unit", "Owner", "Tenant", "Start Date",
            "End Date", "Monthly Rent", "Status", "Term (months)",
        ])

        for lease in leases:
            writer.writerow([
                lease.pk,
                lease.unit.unit_number,
                lease.owner.get_full_name(),
                lease.tenant_full_name,
                lease.lease_start_date,
                lease.lease_end_date,
                lease.monthly_rent,
                lease.get_status_display(),
                lease.term_months,
            ])

        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=leases_report.csv"
        return response
