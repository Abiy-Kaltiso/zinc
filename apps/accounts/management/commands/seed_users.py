from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Create test accounts and seed data for development"

    def handle(self, *args, **options):
        if not User.objects.filter(email="admin@hoatest.com").exists():
            User.objects.create_superuser(
                email="admin@hoatest.com",
                username="admin",
                password="admin123",
                first_name="Board",
                last_name="Admin",
            )
            self.stdout.write(self.style.SUCCESS("Created admin: admin@hoatest.com / admin123"))
        else:
            self.stdout.write("Admin already exists")

        if not User.objects.filter(email="owner@hoatest.com").exists():
            User.objects.create_user(
                email="owner@hoatest.com",
                username="owner",
                password="owner123",
                first_name="Test",
                last_name="Owner",
                role="owner",
            )
            self.stdout.write(self.style.SUCCESS("Created owner: owner@hoatest.com / owner123"))
        else:
            self.stdout.write("Owner already exists")

        # Seed document categories
        from apps.documents.models import DocumentCategory
        categories = ["Lease Agreement", "Screening Report", "Insurance Proof", "Other"]
        for name in categories:
            obj, created = DocumentCategory.objects.get_or_create(name=name)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created document category: {name}"))

        # Seed HOA property
        from apps.properties.models import Property
        prop, created = Property.objects.get_or_create(
            name="Glenwood Park",
            defaults={
                "address": "Glenwood Park HOA",
                "minimum_lease_term_months": 12,
                "require_screening_for_approval": True,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Created property: Glenwood Park"))
