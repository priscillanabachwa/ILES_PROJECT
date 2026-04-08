from rest_framework import serializers
from .models import AcademicEvaluation
class AcademicEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model =AcademicEvaluation
        fields = '__all__'
        read_only_fields = ['total_score','evaluated_at']