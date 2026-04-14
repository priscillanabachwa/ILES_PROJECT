from rest_framework import serializers
from .models import Company
from .models import InternshipPlacement

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['created_at']
class InternshipPlacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipPlacement
        fields = [
            'id', 'student', 'student_name', 'company', 'company_name',
            'workplace_supervisor', 'academic_supervisor', 
            'start_date', 'end_date', 'status'
        ]
        read_only_fields = ['status', 'workplace_supervisor', 'academic_supervisor','start_date','end date',
                            'created_at','modified_at']


class PlacementSerializer(serializers.ModelSerializer):
    student_username = serializers.ReadOnlyField(source='student.username')

    class Meta:
        model = InternshipPlacement
        fields = ['id', 'student', 'student_username', 'company_name', 'start_date', 'end_date', 'status']
