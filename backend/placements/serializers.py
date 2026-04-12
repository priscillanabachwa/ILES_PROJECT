from rest_framework import serializers
from .models import CustomUser, InternshipPlacement, WeeklyLog, Evaluation
from datetime import date

class PlacementSerializer(serializers.ModelSerializer):
    student_username = serializers.ReadOnlyField(source='student.username')

    class Meta:
        model = InternshipPlacement
        fields = '__all__'
        
    def validate(self,data):
        if data ['end_date']<=data['start_date']:
            raise serializers.ValidationError(
                'End date must be after Start date'
            )
        student =data['student']
        overlapping = InternshipPlacement.objects.filter(
            student=student,
            status='active'
        )
        if overlapping.exists():
            raise serializers.ValidationError(
                'This student already has an active placement'
            )
        return data