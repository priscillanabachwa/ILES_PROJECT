from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AcademicEvaluation, EvaluationCriteria, EvaluationScore
from .serializers import (
    AcademicEvaluationSerializer,
    EvaluationCriteriaSerializer,
    EvaluationScoreSerializer,
)

class AcademicEvaluationViewSet(viewsets.ModelViewSet):
    serializer_class = AcademicEvaluationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs   = AcademicEvaluation.objects.filter(
            is_active=True
        ).select_related('log').prefetch_related('items__criteria')

        if user.role == 'student':
            return qs.filter(placement__student=user, status='SUBMITTED')

        if user.role == 'admin':
            return qs

        return qs.filter(evaluator=user)

    def perform_create(self, serializer):
        serializer.save(evaluator=self.request.user)

class EvaluationCriteriaViewSet(viewsets.ModelViewSet):
    serializer_class = EvaluationCriteriaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = EvaluationCriteria.objects.filter(is_active=True)
        evaluator_type = self.request.query_params.get('type')
        if evaluator_type:
            qs = qs.filter(evaluator_type=evaluator_type)
        return qs

class EvaluationScoreViewSet(viewsets.ModelViewSet):
    queryset         = EvaluationScore.objects.all().select_related('criteria')
    serializer_class = EvaluationScoreSerializer
    permission_classes = [IsAuthenticated]
