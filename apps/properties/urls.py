from django.urls import path

from apps.properties.views import (
    MyUnitsView,
    PropertyDetailView,
    PropertyListView,
    UnitDetailView,
    UnitListView,
    UnitOwnershipListCreateView,
)

app_name = "properties"

urlpatterns = [
    path("", PropertyListView.as_view(), name="property-list"),
    path("<int:pk>/", PropertyDetailView.as_view(), name="property-detail"),
    path("<int:property_pk>/units/", UnitListView.as_view(), name="unit-list"),
    path("units/<int:pk>/", UnitDetailView.as_view(), name="unit-detail"),
    path("units/<int:unit_pk>/ownership/", UnitOwnershipListCreateView.as_view(), name="unit-ownership"),
    path("my-units/", MyUnitsView.as_view(), name="my-units"),
]
