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
    class Meta:
        model = EvaluationScore
        fields ='__all__'
        read_only_fields = ['total_score','evaluated_at']

    def validate(self,data):
        criteria = data.get('criteria')
        score = data.get('score')
        if score >criteria.max_score:
            raise serializers.ValidationError(
                f"Score{score} exceeds maximum allowed "
            )
        return data



class AcademicEvaluationSerializer(serializers.ModelSerializer):
    items = EvaluationScoreSerializer(many=True, read_only=True)
    total_score = serializers.SerializerMethodField()

    class Meta:
        model = AcademicEvaluation
        fields =[
            'id', 'placement',  'items', 
            'total_score', 'grade', 'status', 'overall_comment', 
            'submitted_at', 'created_at','activity_choices'
        ]
        read_only_fields = [
            'submitted_at','activity_choices', 'total_score','grade', 'created_at','submitted_at'
        ]

    def get_total_score(self, obj):
        return obj.calculate_total_score()


    def update(self,instance, data, validated_data):
        
        if instance.status == 'submitted':
             raise serializers.ValidationError ("Cannot edit a submitted evaluation")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance



