import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.tests.factories import AdminFactory, BoardMemberFactory, UserFactory


@pytest.mark.django_db
class TestAuthEndpoints:
    def setup_method(self):
        self.client = APIClient()

    def test_login(self):
        user = UserFactory(email="login@test.com")
        response = self.client.post(
            reverse("accounts:token_obtain_pair"),
            {"email": "login@test.com", "password": "testpass123"},
        )
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_invalid_credentials(self):
        UserFactory(email="login@test.com")
        response = self.client.post(
            reverse("accounts:token_obtain_pair"),
            {"email": "login@test.com", "password": "wrongpass"},
        )
        assert response.status_code == 401

    def test_me_authenticated(self):
        user = UserFactory()
        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("accounts:me"))
        assert response.status_code == 200
        assert response.data["email"] == user.email

    def test_me_unauthenticated(self):
        response = self.client.get(reverse("accounts:me"))
        assert response.status_code == 401


@pytest.mark.django_db
class TestUserListEndpoints:
    def setup_method(self):
        self.client = APIClient()

    def test_board_member_can_list_users(self):
        board = BoardMemberFactory()
        UserFactory.create_batch(3)
        self.client.force_authenticate(user=board)
        response = self.client.get(reverse("accounts:user-list"))
        assert response.status_code == 200

    def test_owner_cannot_list_users(self):
        owner = UserFactory()
        self.client.force_authenticate(user=owner)
        response = self.client.get(reverse("accounts:user-list"))
        assert response.status_code == 403

    def test_admin_can_create_user(self):
        admin = AdminFactory()
        self.client.force_authenticate(user=admin)
        response = self.client.post(
            reverse("accounts:user-create"),
            {
                "email": "new@test.com",
                "username": "newuser",
                "first_name": "New",
                "last_name": "User",
                "role": "owner",
                "password": "securepass123",
            },
        )
        assert response.status_code == 201

    def test_board_member_cannot_create_user(self):
        board = BoardMemberFactory()
        self.client.force_authenticate(user=board)
        response = self.client.post(
            reverse("accounts:user-create"),
            {
                "email": "new@test.com",
                "username": "newuser",
                "first_name": "New",
                "last_name": "User",
                "role": "owner",
                "password": "securepass123",
            },
        )
        assert response.status_code == 403
