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
        fields = '__all__'
        read_only_fields = ['start_date','end date','status','created_at','modified_at']
from .models import InternshipPlacement

class PlacementSerializer(serializers.ModelSerializer):
    student_username = serializers.ReadOnlyField(source='student.username')

    class Meta:
        model = InternshipPlacement
        fields = ['id', 'student', 'student_username', 'company_name', 'start_date', 'end_date', 'status']
