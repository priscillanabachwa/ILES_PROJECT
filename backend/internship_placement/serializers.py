from rest_framework import serializers
from .models import InternshipPlacement
class InternshipPlacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipPlacement
        fields = '__all__'