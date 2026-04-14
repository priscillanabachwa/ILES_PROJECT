from django.utils import timezone
from rest_framework import serializers
from .models import WeeklyLogbook

class WeeklyLogbookSerializer(serializers.ModelSerializer):

    class Meta:
        model = WeeklyLogbook
        fields = [
            'id', 'internship_id', 'week_number', 'activities',
            'challenges', 'lesson', 'status', 'supervisor_comment',
            'deadline', 'submitted_at'
        ]
        read_only_fields = [
            'created_at', 'submitted_at', 'updated_at',
            'status', 'supervisor_comment', 'deadline'
        ]

    def validate_week_number(self, value):
       
        
        if value <= 0:
            raise serializers.ValidationError("Week number must be greater than zero.")
        return value

    def validate(self, data):
        
        if self.instance and self.instance.status == 'approved':
            raise serializers.ValidationError("Approved logs cannot be modified.")

       
        new_status = data.get('status')
        
        if new_status == 'submitted':
            deadline = getattr(self.instance, 'deadline', None)
            if deadline and timezone.now().date() > deadline:
                raise serializers.ValidationError("Cannot submit a log after the deadline has passed.")

        return data