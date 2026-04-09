from rest_framework import serializers
from .models import AcademicEvaluation
from .models import EvaluationCriteria
from .models import EvaluationScore
class AcademicEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model =AcademicEvaluation
        fields = '__all__'
        read_only_fields = ['submitted_at','total_score','created_at','submitted_at']
class EvaluationCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
       
       model = EvaluationCriteria
       fields = '__all__'
       read_only_fields = ['weight']
       
class EvaluationScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationScore
        fields ='__all__'
        read_only_fields = ['score','evaluation','criteria']