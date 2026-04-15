from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import WeeklyLogbook
from .serializer import WeeklyLogbookSerializer


class WeeklyLogbookViewSet(viewsets.ModelViewSet):
    serializer_class = WeeklyLogbookSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'student':
            return WeeklyLogbook.objects.filter(placement__student=user)

        elif user.role == 'workplace_supervisor':
            return WeeklyLogbook.objects.filter(placement__workplace_supervisor=user)

        elif user.role == 'academic_supervisor':
            return WeeklyLogbook.objects.filter(placement__academic_supervisor=user)

        # admin sees all
        return WeeklyLogbook.objects.all()

    def perform_create(self, serializer):
        serializer.save()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.status == 'approved':
            return Response(
                {'detail': 'Cannot edit an approved log.'},
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