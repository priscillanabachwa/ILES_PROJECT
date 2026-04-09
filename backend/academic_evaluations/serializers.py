from rest_framework import serializers
from .models import AcademicEvaluation
class AcademicEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model =AcademicEvaluation
        fields = '__all__'
        read_only_fields = ['total_score','evaluated_at']
from .models import AcademicEvaluation, EvaluationScore

class EvaluationScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationScore
        fields = '__all__' 

class AcademicEvaluationSerializer(serializers.ModelSerializer):
    items = EvaluationScoreSerializer(many=True, read_only=True)

    class Meta:
        model = AcademicEvaluation
        fields = ['id', 'placement', 'status', 'total_score', 'submitted_at', 'items']
