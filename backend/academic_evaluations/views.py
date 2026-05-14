
from rest_framework import viewsets
from .models import AcademicEvaluation, EvaluationCriteria, EvaluationScore
from .serializers import AcademicEvaluationSerializer, EvaluationCriteriaSerializer, EvaluationScoreSerializer


class AcademicEvaluationViewSet(viewsets.ModelViewSet):
    serializer_class = AcademicEvaluationSerializer

    def get_queryset(self):
        return AcademicEvaluation.objects.filter(
            is_active=True,
            evaluator=self.request.user,
        ).prefetch_related('items__criteria')

    def perform_create(self, serializer):
        serializer.save(evaluator=self.request.user)


class EvaluationCriteriaViewSet(viewsets.ModelViewSet):
    serializer_class = EvaluationCriteriaSerializer

    def get_queryset(self):
        qs = EvaluationCriteria.objects.filter(is_active=True)
        evaluator_type = self.request.query_params.get('type')
        if evaluator_type:
            qs = qs.filter(evaluator_type=evaluator_type)
        return qs


class EvaluationScoreViewSet(viewsets.ModelViewSet):
    queryset = EvaluationScore.objects.all().select_related('criteria')
    serializer_class = EvaluationScoreSerializer

