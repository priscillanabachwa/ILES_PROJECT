from rest_framework import serializers
from .models import WeeklyLogbook
from django.utils import timezone


class WeeklyLogbookSerializer(serializers.ModelSerializer):

    class Meta:
        model = WeeklyLogbook
<<<<<<< Updated upstream
        fields = '__all__'
=======
        fields = [
            'id', 'internship_id', 'week_number', 'activities',
            'challenges', 'lesson', 'status', 'supervisor_comment',
            'deadline', 'submitted_at'
        ]
        read_only_fields = [
            'created_at', 'submitted_at', 'updated_at',
            'status', 'supervisor_comment', 'deadline'
        ]
>>>>>>> Stashed changes

    def validate_week_number(self, value):
        if value <= 0:
            raise serializers.ValidationError("Week number cannot be negative.")
        return value

<<<<<<< Updated upstream
    def validate(self, date):
        if 'status' in data and data ['status'] == 'submitted':
            if data.get('deadline') and date.today() > data['deadline']:
                raise serializers.ValidationError(
                    'Cannot submit a log after the deadline'
                )
        
        if self.instance and self.instance.status == 'approved':
            raise serializers.ValidationError(
                'Cannot edit an approved log'
            )
    
=======
    def validate_log(self, data):
        if self.instance and self.instance.status == 'approved':
            raise serializers.ValidationError("Approved log cannot be modified.")
        return data

    def validate(self, data):
        if 'status' in data and data['status'] == 'submitted':
            if data.get('deadline') and timezone.now().date() > data['deadline']:
                raise serializers.ValidationError("Cannot submit a log after the deadline.")

        if self.instance and self.instance.status == 'approved':
            raise serializers.ValidationError("Cannot edit an approved log.")

>>>>>>> Stashed changes
        return data