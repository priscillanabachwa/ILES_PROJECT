from rest_framework import serializers
from .models import AcademicEvaluation
from .models import EvaluationScore
class AcademicEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model =AcademicEvaluation
        fields = '__all__'
        read_only_fields = ['total_score','evaluated_at','created_at','submitted_at','updated at']
class EvaluationScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationScore
        fields = '__all__'

        