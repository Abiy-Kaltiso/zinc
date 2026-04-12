from django.contrib import admin

from apps.leases.models import Lease, LeaseAmendment, LeaseReview, Tenant


class LeaseReviewInline(admin.TabularInline):
    model = LeaseReview
    extra = 0
    readonly_fields = ["reviewer", "decision", "comments", "created_at"]


class LeaseAmendmentInline(admin.TabularInline):
    model = LeaseAmendment
    extra = 0
    readonly_fields = ["amended_by", "created_at"]


class TenantInline(admin.TabularInline):
    model = Tenant
    extra = 1


@admin.register(Lease)
class LeaseAdmin(admin.ModelAdmin):
    list_display = [
        "id", "unit_number", "owner",
        "lease_start_date", "lease_end_date", "status",
    ]
    list_filter = ["status"]
    search_fields = [
        "unit_number", "owner__email",
        "tenants__first_name", "tenants__last_name",
    ]
    raw_id_fields = ["owner"]
    inlines = [TenantInline, LeaseReviewInline, LeaseAmendmentInline]


@admin.register(LeaseReview)
class LeaseReviewAdmin(admin.ModelAdmin):
    list_display = ["lease", "reviewer", "decision", "created_at"]
    list_filter = ["decision"]
