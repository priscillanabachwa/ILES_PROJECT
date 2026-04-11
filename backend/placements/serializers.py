from rest_framework import serializers
from .models import InternshipPlacement

class PlacementSerializer(serializers.ModelSerializer):
    student_username = serializers.ReadOnlyField(source='student.username')

    class Meta:
        model = InternshipPlacement
        fields = ['id', 'student', 'student_username', 'company_name', 'start_date', 'end_date', 'status']
        
    def validate(self,data):
        if data ['end_date']<=data['start_date']:
            raise serializers.ValidationError(
                'End date must be after Start date'
            )
        student =data['student']
        overlapping = InternshipPlacement.objects.filter(
            student=student
            status='active'
        )
        if overlapping.exists():
            raise serializers.ValidationError(
                'This student already has an active placement'
            )
        return data