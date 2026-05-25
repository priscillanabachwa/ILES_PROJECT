from decimal import Decimal, ROUND_HALF_UP
from rest_framework import serializers
from .models import AcademicEvaluation, EvaluationCriteria, EvaluationScore

class EvaluationCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model  = EvaluationCriteria
        fields = '__all__'

class EvaluationScoreSerializer(serializers.ModelSerializer):
    criteria_name = serializers.CharField(source='criteria.name',      read_only=True)
    max_score     = serializers.IntegerField(source='criteria.max_score', read_only=True)

    class Meta:
        model  = EvaluationScore
        fields = ['id', 'evaluation', 'criteria', 'criteria_name', 'score', 'max_score']

    def validate(self, data):
        criteria = data.get('criteria')
        score    = data.get('score')
        if criteria is not None and score is not None and score > criteria.max_score:
            raise serializers.ValidationError(
                f"Score {score} exceeds maximum allowed ({criteria.max_score})"
            )
        return data

class AcademicEvaluationSerializer(serializers.ModelSerializer):
    items          = EvaluationScoreSerializer(many=True, read_only=True)
    total_score    = serializers.SerializerMethodField()
    evaluator_role = serializers.SerializerMethodField()
    log_week_number = serializers.SerializerMethodField()

    class Meta:
        model  = AcademicEvaluation
        fields = [
            'id', 'placement', 'log', 'log_week_number', 'visit_number', 'items',
            'total_score', 'grade', 'status', 'overall_comment',
            'submitted_at', 'updated_at', 'created_at',
            'evaluator_role',
        ]
        read_only_fields = [
            'submitted_at', 'updated_at', 'created_at',
            'total_score', 'grade', 'log_week_number',
        ]

    def get_total_score(self, obj):
        return obj.calculate_total_score()

    def get_evaluator_role(self, obj):
        return getattr(obj.evaluator, 'role', None)

    def get_log_week_number(self, obj):
        return obj.log.week_number if obj.log else None

    def create(self, validated_data):
        if validated_data.get('log') and not validated_data.get('placement'):
            validated_data['placement'] = validated_data['log'].placement
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
