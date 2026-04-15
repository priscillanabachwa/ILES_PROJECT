
from rest_framework import viewsets
from .models import AcademicEvaluation,EvaluationCriteria,EvaluationScore
from .serializers import AcademicEvaluationSerializer,EvaluationCriteriaSerializer,EvaluationScoreSerializer

class AcademicEvaluationViewSet(viewsets.ModelViewSet):
    queryset = AcademicEvaluation.objects.all().filter(is_active =True)
    serializer_class = AcademicEvaluationSerializer

    
class EvaluationCriteriaViewSet(viewsets.ModelViewSet):
    queryset = EvaluationCriteria.objects.all()
    serializer_class = EvaluationCriteriaSerializer
class EvaluationScoreViewSets(viewsets.ModelViewSet):
    queryset = EvaluationScore.objects.all()
    serializer_class = EvaluationScoreSerializer

