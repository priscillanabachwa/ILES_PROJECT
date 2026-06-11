from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.core.mail import send_mail
from .models import WeeklyLogbook, LogBookReview
from .serializers import WeeklyLogbookSerializer
from .permissions import CanSubmitLog, CanApproveLog, CanReviewLog, CanRejectLog
    

class WeeklyLogbookViewSet(viewsets.ModelViewSet):
    serializer_class = WeeklyLogbookSerializer

    def get_permissions(self):
        if self.action == 'create':
            return[IsAuthenticated()]
        elif self.action == 'submit':
            return[CanSubmitLog()]
        elif self.action == 'review':
            return[CanReviewLog()]
        elif self.action == 'approve':
            return[CanApproveLog()]
        elif self.action == 'reject':
            return[CanRejectLog()]
        
        return[IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = WeeklyLogbook.objects.all()
        role_filters = {
            'student': 'placement__student',
            'workplace_supervisor': 'placement__workplace_supervisor',
            'academic_supervisor': 'placement__academic_supervisor',
        }
        lookup_field = role_filters.get(user.role)
        if lookup_field:
            return queryset.filter(**{lookup_field: user})
        return queryset

    def perform_create(self, serializer):
        if self.request.user.role != 'student':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only students can create logbooks.')

        from datetime import timedelta
        from rest_framework.exceptions import ValidationError
        placement   = serializer.validated_data.get('placement')
        week_number = serializer.validated_data.get('week_number', 1)

        if serializer.validated_data.get('status') == 'submitted' and placement:
            if not placement.workplace_supervisor or not placement.academic_supervisor:
                raise ValidationError(
                    'You cannot submit a log until both a workplace supervisor and an '
                    'academic supervisor have been assigned to your placement. '
                    'Please contact your administrator.'
                )

        if placement and placement.start_date:
            deadline = placement.start_date + timedelta(weeks=week_number)
        else:
            deadline = timezone.now().date() + timedelta(days=7 * week_number)

        extra = {'deadline': deadline}
        if serializer.validated_data.get('status') == 'submitted':
            extra['submitted_at'] = timezone.now()

        serializer.save(**extra)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        if instance.status == 'approved':
            return Response(
                {'detail': 'Cannot edit an approved log.'},
                status=400
            )
        if user.role == 'student' and instance.status != 'draft':
            return Response(
                {'detail': 'You can only edit logs while they are in draft status.'},
                status=400
            )
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        extra = {}
        if serializer.validated_data.get('status') == 'submitted':
            extra['submitted_at'] = timezone.now()
        serializer.save(**extra)

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        log = self.get_object()
        if log.status != 'draft':
            return Response(
                {'detail': f'Cannot submit a log with status "{log.status}".'},
                status=400
            )
        if timezone.now().date() > log.deadline:
            return Response(
                {'detail': 'Cannot submit a log after the deadline.'},
                status=400
            )
        log.status = 'submitted'
        log.submitted_at = timezone.now()
        log.save()
        return Response(WeeklyLogbookSerializer(log).data)

    @action(detail=True, methods=['post'], url_path='review')
    def review(self, request, pk=None):
        log = self.get_object()
        role = request.user.role

        if role in ('workplace_supervisor', 'admin'):
            if log.status != 'submitted':
                return Response(
                    {'detail': 'Only submitted logs can be reviewed.'},
                    status=400
                )
            comment = request.data.get('supervisor_comment', '').strip()
            if not comment:
                return Response(
                    {'detail': 'A supervisor comment is required to review a log.'},
                    status=400
                )
            log.status = 'reviewed'
            log.supervisor_comment = comment
            log.save()
            LogBookReview.objects.create(
                logbook=log,
                supervisor=request.user,
                comment=comment,
                status_at_review='reviewed'
            )
        else:
            return Response(
                {'detail': 'You do not have permission to review logs.'},
                status=403
            )

        return Response(WeeklyLogbookSerializer(log).data)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        log = self.get_object()
        if request.user.role not in ('academic_supervisor', 'admin'):
            return Response(
                {'detail': 'You do not have permission to approve logs.'},
                status=403
            )
        if log.status not in ('submitted', 'reviewed'):
            return Response(
                {'detail': 'Only submitted or reviewed logs can be approved.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        comment = request.data.get('supervisor_comment', '').strip()
        if comment:
            log.supervisor_comment = comment
        log.status = 'approved'
        log.save()
        return Response(WeeklyLogbookSerializer(log).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        log = self.get_object()
        role = request.user.role

        if role in ('academic_supervisor', 'admin'):
            if log.status not in ('submitted', 'reviewed'):
                return Response(
                    {'detail': 'You can only reject submitted or reviewed logs.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            comment = request.data.get('supervisor_comment', '').strip()
            if not comment:
                return Response(
                    {'detail': 'A comment is required to reject a log.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            log.status = 'draft'
            log.supervisor_comment = comment
            log.save()
        else:
            return Response(
                {'detail': 'You do not have permission to reject logs.'},
                status=403
            )
        return Response(WeeklyLogbookSerializer(log).data)
