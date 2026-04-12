from django.contrib import admin

from apps.properties.models import Property, Unit, UnitOwnership


class UnitInline(admin.TabularInline):
    model = Unit
    extra = 0


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ["name", "address", "minimum_lease_term_months", "require_screening_for_approval"]
    inlines = [UnitInline]


class UnitOwnershipInline(admin.TabularInline):
    model = UnitOwnership
    extra = 0
    raw_id_fields = ["owner"]


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ["unit_number", "hoa_property", "occupancy_status"]
    list_filter = ["hoa_property", "occupancy_status"]
    search_fields = ["unit_number", "address_line"]
    inlines = [UnitOwnershipInline]


@admin.register(UnitOwnership)
class UnitOwnershipAdmin(admin.ModelAdmin):
    list_display = ["unit", "owner", "is_current", "acquired_date"]
    list_filter = ["is_current"]
    raw_id_fields = ["unit", "owner"]
