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
       read_only_fields = ['fields']
       
class EvaluationScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationScore
        fields ='__all__'
        read_only_fields = ['total_score','evaluated_at']
    def validate_data(self,data):
        criteria = data.get('criteria')
        score = data.get('score')
        if score >criteria.max_score:
            raise serializers.ValidationError(
                f"Score{score} exceeds maximum allowed "
            )
        return data




class AcademicEvaluationSerializer(serializers.ModelSerializer):
    items = EvaluationScoreSerializer(many=True, read_only=True)

    class Meta:
        model = AcademicEvaluation
        fields =[
            'id', 'placement',  'items', 
            'total_score', 'grade', 'status', 'overall_comment', 
            'submitted_at', 'created_at'
        ]
        read_only_fields = [
            'submitted_at', 'total_score','grade', 'created_at','submitted_at'
        ]
    def update(self,instance, data):
        item_data = data.pop('items', None)
        if instance.status == 'submitted':
            raise serializers.ValidationError ("cannot edit a submitted evaluation")