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
        """
        Ensures the week number is a positive integer.
        """
        if value <= 0:
            raise serializers.ValidationError("Week number must be greater than zero.")
        return value

    def validate(self, data):
        """
        Object-level validation for status-based restrictions and deadlines.
        """
        # 1. Prevent editing if the log is already approved
        # self.instance refers to the record currently in the database
        if self.instance and self.instance.status == 'approved':
            raise serializers.ValidationError("Approved logs cannot be modified.")

        # 2. Check deadline if the status is being set to 'submitted'
        # We check 'data' for the new status and 'self.instance' for the existing deadline
        new_status = data.get('status')
        
        if new_status == 'submitted':
            deadline = getattr(self.instance, 'deadline', None)
            if deadline and timezone.now().date() > deadline:
                raise serializers.ValidationError("Cannot submit a log after the deadline has passed.")

        return data