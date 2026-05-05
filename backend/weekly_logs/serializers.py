
from rest_framework import serializers
from datetime import date
from .models import WeeklyLogbook


class WeeklyLogbookSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = WeeklyLogbook

        fields = [
            'id', 'internship_id', 'week_number', 'activities', 
            'challenges', 'lesson', 'status', 'supervisor_comment', 
            'deadline', 'submitted_at'
        ]
        read_only_fields = ['id','submitted_at','supervisor_comment','deadline']

    def validate_week_number(self,value):
            if value <=0:
             return "Week number must be a positive integer."
            return value

      
    def validate(self, date):
        if data.get('status') == 'submitted':
            current_deadline = getattr(self.instance, 'deadline', None)

            if current_deadline and date.today() > current_deadline:
                raise serializers.ValidationError(
                    'Cannot submit a log after the deadline'
                )
        
        if self.instance and self.instance.status == 'approved':
            raise serializers.ValidationError(
                'Approved logs cannot be modified.'
            )
    
        return date 

