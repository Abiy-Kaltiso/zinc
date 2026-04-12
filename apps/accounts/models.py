from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        BOARD_MEMBER = "board_member", "Board Member"
        OWNER = "owner", "Owner"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.OWNER)
    phone = models.CharField(max_length=20, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    class Meta:
        indexes = [models.Index(fields=["role"])]
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    @property
    def is_board_member(self):
        return self.role in (self.Role.BOARD_MEMBER, self.Role.ADMIN)

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN
