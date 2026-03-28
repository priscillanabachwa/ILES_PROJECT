from rest_framework import serializers
from .models import WeightedScoreComputation
class WeightedScoreComputationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightedScoreComputation
        fields = '__all__'
        read_only_fields = ['final_score','grade']