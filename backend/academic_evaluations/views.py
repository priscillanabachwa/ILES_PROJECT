from rest_framework import viewsets
from .models import AcademicEvaluation
from .serializers import AcademicEvaluationSerializer

class AcademicEvaluationViewSet(viewsets.ModelViewSet):
    queryset = AcademicEvaluation.objects.all()
    serializer_class = AcademicEvaluationSerializer
