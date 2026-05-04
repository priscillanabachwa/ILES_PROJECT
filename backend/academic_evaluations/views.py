
from rest_framework import viewsets
from .models import AcademicEvaluation,EvaluationCriteria,EvaluationScore
from .serializers import AcademicEvaluationSerializer,EvaluationCriteriaSerializer,EvaluationScoreSerializer

class AcademicEvaluationViewSet(viewsets.ModelViewSet):
    queryset = AcademicEvaluation.objects.all().filter(is_active =True).prefetch_related('items__criteria')
    serializer_class = AcademicEvaluationSerializer

    
class EvaluationCriteriaViewSet(viewsets.ModelViewSet):
    queryset = EvaluationCriteria.objects.filter(is_active=True)
    serializer_class = EvaluationCriteriaSerializer
class EvaluationScoreViewSet(viewsets.ModelViewSet):
    queryset = EvaluationScore.objects.all().select_related('criteria')
    serializer_class = EvaluationScoreSerializer

