from rest_framework import serializers
from .models import WeeklyLogbook
class WeeklyLogbookSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyLogbook
        fields = '__all__'