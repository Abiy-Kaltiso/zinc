import pytest

from apps.accounts.tests.factories import AdminFactory, BoardMemberFactory, UserFactory


@pytest.mark.django_db
class TestUserModel:
    def test_create_owner(self):
        user = UserFactory()
        assert user.role == "owner"
        assert not user.is_board_member
        assert not user.is_admin_user

    def test_create_board_member(self):
        user = BoardMemberFactory()
        assert user.role == "board_member"
        assert user.is_board_member
        assert not user.is_admin_user

    def test_create_admin(self):
        user = AdminFactory()
        assert user.role == "admin"
        assert user.is_board_member  # admin is also a board member
        assert user.is_admin_user

    def test_email_is_unique(self):
        UserFactory(email="test@example.com")
        with pytest.raises(Exception):
            UserFactory(email="test@example.com")

    def test_str_representation(self):
        user = UserFactory(first_name="John", last_name="Doe", role="owner")
        assert "John Doe" in str(user)
