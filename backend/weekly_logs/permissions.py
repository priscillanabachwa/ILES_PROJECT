from rest_framework.permissions import BasePermission

class CanSubmitLog(BasePermission):
    def has_permission(self, request, view):
         return request.user.has_perm('weekly_logs.can_submit_weekly_log')

class CanApproveLog(BasePermission):
    def has_permission(self, request, view):
         return request.user.has_perm('weekly_logs.can_approve_weekly_log')
        