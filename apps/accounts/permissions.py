from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsBoardMember(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("board_member", "admin")


class IsOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("owner", "board_member", "admin")


class IsLeaseOwner(BasePermission):
    """Object-level: user is the owner who submitted this lease."""

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user


class IsBoardMemberOrLeaseOwner(BasePermission):
    """Board members can access any lease; owners can access their own."""

    def has_object_permission(self, request, view, obj):
        if request.user.role in ("board_member", "admin"):
            return True
        return obj.owner == request.user
