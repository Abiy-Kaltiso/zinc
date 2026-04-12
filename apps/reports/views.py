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
from apps.properties.models import Property, Unit


class DashboardView(APIView):
    permission_classes = [IsBoardMember]

    def get(self, request):
        today = date.today()
        thirty_days = today + timedelta(days=30)
        sixty_days = today + timedelta(days=60)
        ninety_days = today + timedelta(days=90)

        active_leases = Lease.objects.filter(status=Lease.Status.ACTIVE)
        pending_leases = Lease.objects.filter(status=Lease.Status.PENDING_REVIEW)

        total_leases = Lease.objects.filter(
            status__in=[Lease.Status.ACTIVE, Lease.Status.APPROVED, Lease.Status.PENDING_REVIEW]
        ).count()

        return Response({
            "active_leases": active_leases.count(),
            "pending_reviews": pending_leases.count(),
            "total_leases": total_leases,
            "expiring_30_days": active_leases.filter(
                lease_end_date__lte=thirty_days, lease_end_date__gte=today
            ).count(),
            "expiring_60_days": active_leases.filter(
                lease_end_date__lte=sixty_days, lease_end_date__gte=today
            ).count(),
            "expiring_90_days": active_leases.filter(
                lease_end_date__lte=ninety_days, lease_end_date__gte=today
            ).count(),
            "occupancy": {
                "total": total_leases,
                "owner_occupied": 0,
                "rented": active_leases.count(),
                "vacant": 0,
            },
        })


class ActiveLeasesReportView(APIView):
    permission_classes = [IsBoardMember]

    def get(self, request):
        leases = Lease.objects.filter(
            status=Lease.Status.ACTIVE
        ).select_related("owner").prefetch_related("tenants")

        unit_number = request.query_params.get("unit_number")
        if unit_number:
            leases = leases.filter(unit_number=unit_number)

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
        ).select_related("owner").prefetch_related("tenants")

        prop = Property.objects.first()
        min_term = prop.minimum_lease_term_months if prop else 12

        report = []
        for lease in leases:
            screening = getattr(lease, "screening", None)
            screening_complete = screening.all_checks_completed if screening else False
            screening_verified = screening.verified_at is not None if screening else False

            term_compliant = lease.term_months >= min_term

            from django.contrib.contenttypes.models import ContentType
            from apps.documents.models import Document
            lease_ct = ContentType.objects.get_for_model(Lease)
            doc_count = Document.objects.filter(
                content_type=lease_ct, object_id=lease.pk, is_current_version=True
            ).count()

            report.append({
                "lease_id": lease.pk,
                "unit_number": lease.unit_number,
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
        ).select_related("owner").prefetch_related("tenants").order_by("lease_end_date")

        serializer = LeaseSerializer(leases, many=True)
        return Response(serializer.data)


class OccupancyOverviewView(APIView):
    permission_classes = [IsBoardMember]

    def get(self, request):
        # Show lease-based occupancy since units are now free text
        active_leases = Lease.objects.filter(
            status=Lease.Status.ACTIVE
        ).select_related("owner").prefetch_related("tenants")

        data = []
        for lease in active_leases:
            data.append({
                "unit_number": lease.unit_number,
                "occupancy_status": "rented",
                "owner_name": lease.owner.get_full_name(),
                "tenant_name": lease.tenant_full_name,
                "lease_end_date": lease.lease_end_date,
            })
        return Response(data)


class LeaseExportCSVView(APIView):
    permission_classes = [IsBoardMember]

    def get(self, request):
        leases = Lease.objects.filter(
            status__in=[Lease.Status.ACTIVE, Lease.Status.APPROVED, Lease.Status.PENDING_REVIEW]
        ).select_related("owner").prefetch_related("tenants")

        output = StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Lease ID", "Unit", "Owner", "Tenant(s)", "Start Date",
            "End Date", "Monthly Rent", "Status", "Term (months)",
        ])

        for lease in leases:
            tenant_names = ", ".join(
                t.full_name for t in lease.tenants.all()
            )
            writer.writerow([
                lease.pk,
                lease.unit_number,
                lease.owner.get_full_name(),
                tenant_names,
                lease.lease_start_date,
                lease.lease_end_date,
                lease.monthly_rent,
                lease.get_status_display(),
                lease.term_months,
            ])

        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=leases_report.csv"
        return response
