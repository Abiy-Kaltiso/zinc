from django.contrib import admin

from apps.screening.models import ScreeningChecklist, ScreeningCheckResult, ScreeningRecord


@admin.register(ScreeningChecklist)
class ScreeningChecklistAdmin(admin.ModelAdmin):
    list_display = ["name", "hoa_property", "is_required", "order"]
    list_filter = ["hoa_property", "is_required"]


class ScreeningCheckResultInline(admin.TabularInline):
    model = ScreeningCheckResult
    extra = 0


@admin.register(ScreeningRecord)
class ScreeningRecordAdmin(admin.ModelAdmin):
    list_display = ["lease", "all_checks_completed", "verified_by", "verified_at"]
    list_filter = ["all_checks_completed"]
    inlines = [ScreeningCheckResultInline]
