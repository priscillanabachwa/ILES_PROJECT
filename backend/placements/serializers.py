
from rest_framework import serializers
from .models import  InternshipPlacement ,Company
from datetime import date
from user_accounts.models import CustomUser
from weekly_logs.models import WeeklyLogbook
from academic_evaluations.models import (
    EvaluationCriteria,
    AcademicEvaluation,
    EvaluationScore
) 


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

