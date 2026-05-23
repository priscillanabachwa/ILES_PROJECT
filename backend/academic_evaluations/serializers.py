from decimal import Decimal, ROUND_HALF_UP
from rest_framework import serializers
from .models import AcademicEvaluation
from .models import EvaluationCriteria
from .models import EvaluationScore



class EvaluationCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
       
       model = EvaluationCriteria
       fields = '__all__'
       read_only_fields = ['fields']
       
class EvaluationScoreSerializer(serializers.ModelSerializer):
    criteria_name = serializers.CharField(source='criteria.name', read_only=True)
    max_score     = serializers.IntegerField(source='criteria.max_score', read_only=True)

    class Meta:
        model = EvaluationScore
        fields = ['id', 'evaluation', 'criteria', 'criteria_name', 'score', 'max_score']
        read_only_fields = ['evaluated_at']

    def validate(self, data):
        criteria = data.get('criteria')
        score = data.get('score')
        if criteria is not None and score is not None and score > criteria.max_score:
            raise serializers.ValidationError(
                f"Score {score} exceeds maximum allowed ({criteria.max_score})"
            )
        return data



class AcademicEvaluationSerializer(serializers.ModelSerializer):
    items         = EvaluationScoreSerializer(many=True, read_only=True)
    total_score   = serializers.SerializerMethodField()
    evaluator_role = serializers.SerializerMethodField()

    class Meta:
        model = AcademicEvaluation
        fields =[
            'id', 'placement', 'items',
            'total_score', 'grade', 'status', 'overall_comment',
            'submitted_at', 'updated_at', 'created_at', 'activity_choices',
            'evaluator_role',
        ]
        read_only_fields = [
            'submitted_at', 'updated_at', 'activity_choices', 'total_score', 'grade', 'created_at',
        ]

    def get_total_score(self, obj):
        return obj.calculate_total_score()

    def get_evaluator_role(self, obj):
        return getattr(obj.evaluator, 'role', None)


    def update(self, instance, validated_data):
        # Allow updating submitted evaluations so supervisors can refresh marks
        # after approving new weekly logs during an ongoing internship.
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance



