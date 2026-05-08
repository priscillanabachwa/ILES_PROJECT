
from rest_framework import serializers
from datetime import date
from .models import WeeklyLogbook


class LogbookReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogBookReview
        fields = [ 'supervisor', 'comment', 'status_at_review', 'created_at']

class WeeklyLogbookSerializer(serializers.ModelSerializer):
    reviews = LogbookReviewSerializer(many=True, read_only=True)
    internship_id = serializers.IntegerField(source='placement.id', read_only=True)
    
    class Meta:
        model = WeeklyLogbook

        fields = [
            'id', 'internship_id', 'week_number', 'activities', 
            'challenges', 'lesson', 'status', 'supervisor_comment', 
            'deadline', 'submitted_at'
        ]
        read_only_fields = ['id','submitted_at','deadline']

    def validate_week_number(self,value):
            if value <=0:
             return "Week number must be a positive integer."
            return value

      
    def validate(self, data):
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
    
        return data 

