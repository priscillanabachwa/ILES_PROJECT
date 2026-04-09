from rest_framework import serializers
from .models import InternshipPlacement

class PlacementSerializer(serializers.ModelSerializer):
    student_username = serializers.ReadOnlyField(source='student.username')

    class Meta:
        model = InternshipPlacement
        fields = ['id', 'student', 'student_username', 'company_name', 'start_date', 'end_date', 'status']