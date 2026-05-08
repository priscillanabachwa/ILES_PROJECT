from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.core.mail import send_mail
from .models import WeeklyLogbook
from .serializers import WeeklyLogbookSerializer


class WeeklyLogbookViewSet(viewsets.ModelViewSet):
    serializer_class = WeeklyLogbookSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = WeeklyLogbook.objects.all()

        role_filters = {   
            'student': {'placement__student'},
            'workplace_supervisor': {'placement__workplace_supervisor'},  
            'academic_supervisor': {'placement__academic_supervisor'},
        }
        lookup_fields = role_filters.get(user.role)
        if lookup_fields:
            return queryset.filter(**{lookup_fields: user})
        return queryset
        


    def perform_create(self, serializer):
        if self.request.user.role == 'student':
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only students can create logbooks.')

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user

        if instance.status == 'approved':
            return Response(
                {'detail': 'Cannot edit an approved log.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if user.role == 'student' and instance.status != 'draft':
            return Response(
                {'detail': 'You can only edit logs while they are in draft status.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        log = self.get_object()

        if log.status != 'draft':
            return Response(
                {'detail': f'Cannot submit a log with status "{log.status}".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if timezone.now().date() > log.deadline:
            return Response(
                {'detail': 'Cannot submit a log after the deadline.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        log.status = 'submitted'
        log.submitted_at = timezone.now()
        log.save()
        return Response(WeeklyLogbookSerializer(log).data)

    @action(detail=True, methods=['post'], url_path='review')
    def review(self, request, pk=None):
        log = self.get_object()

        if request.user.role not in ('workplace_supervisor', 'academic_supervisor', 'admin'):
            return Response(
                {'detail': 'You do not have permission to review logs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if log.status != 'submitted':
            return Response(
                {'detail': 'Only submitted logs can be reviewed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        comment = request.data.get('supervisor_comment', '').strip()
        if not comment:
            return Response(
                {'detail': 'A supervisor comment is required to review a log.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        log.status = 'reviewed'
        log.supervisor_comment = comment
        log.save()
        return Response(WeeklyLogbookSerializer(log).data)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        log = self.get_object()

        if request.user.role not in ('academic_supervisor', 'admin'):
            return Response(
                {'detail': 'You do not have permission to approve logs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if log.status != 'reviewed':
            return Response(
                {'detail': 'Only reviewed logs can be approved.'},
                status=status.HTTP_400_BAD_REQUEST        )

        log.status = 'approved'
        log.save()
        return Response(WeeklyLogbookSerializer(log).data)

        @action(detail=True, methods=['post'], url_path='reject')
        def reject(self, request, pk=None):
            log = self.get_object()

            if request.user.role not in ('workplace_supervisor', 'academic_supervisor', 'admin'):
                return Response(
                    {'detail': 'You do not have permission to reject logs.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if log.status != 'submitted':
                return Response(
                    {'detail': 'Only submitted logs can be rejected.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            comment = request.data.get('supervisor_comment', '').strip()
            if not comment:
                return Response(
                    {'detail': 'A supervisor comment is required to reject a log.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            log.status = 'draft'
            log.supervisor_comment = comment
            log.save()
            return Response(WeeklyLogbookSerializer(log).data)  