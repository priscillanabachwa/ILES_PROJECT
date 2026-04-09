
from rest_framework import serializers
from .models import WeeklyLogbook


class WeeklyLogbookSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = WeeklyLogbook
        fields = '__all__'
        read_only_fields = ['created_at','submitted_at','updated_at']
  