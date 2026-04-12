from django.contrib import admin

from apps.leases.models import Lease, LeaseAmendment, LeaseReview


class LeaseReviewInline(admin.TabularInline):
    model = LeaseReview
    extra = 0
    readonly_fields = ["reviewer", "decision", "comments", "created_at"]


class LeaseAmendmentInline(admin.TabularInline):
    model = LeaseAmendment
    extra = 0
    readonly_fields = ["amended_by", "created_at"]


@admin.register(Lease)
class LeaseAdmin(admin.ModelAdmin):
    list_display = [
        "id", "unit", "owner", "tenant_first_name", "tenant_last_name",
        "lease_start_date", "lease_end_date", "status",
    ]
    list_filter = ["status", "unit__hoa_property"]
    search_fields = [
        "tenant_first_name", "tenant_last_name",
        "unit__unit_number", "owner__email",
    ]
    raw_id_fields = ["unit", "owner"]
    inlines = [LeaseReviewInline, LeaseAmendmentInline]


@admin.register(LeaseReview)
class LeaseReviewAdmin(admin.ModelAdmin):
    list_display = ["lease", "reviewer", "decision", "created_at"]
    list_filter = ["decision"]
