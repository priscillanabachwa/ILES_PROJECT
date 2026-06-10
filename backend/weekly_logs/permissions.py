from rest_framework.permissions import BasePermission

class CanSubmitLog(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'

class CanReviewLog(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'workplace_supervisor', 'academic_supervisor', 'admin'
        )

class CanApproveLog(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'academic_supervisor', 'admin'
        )

class CanRejectLog(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'workplace_supervisor', 'academic_supervisor', 'admin'
        )
