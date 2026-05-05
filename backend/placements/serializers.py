
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
        read_only_fields = ['status', 'workplace_supervisor', 'academic_supervisor','start_date','end_date',
                            'created_at','modified_at']


class PlacementSerializer(serializers.ModelSerializer):
    student_username = serializers.ReadOnlyField(source='student.username')

    class Meta:
        model = InternshipPlacement
        fields = '__all__'
        
    def validate(self,data):
        instance = self.instance

        start_date = data.get('start_date', getattr(instance, 'start_date', None))
        end_date = data.get('end_date', getattr(instance, 'end_date', None))    
        student = data.get('student', getattr(instance, 'student', None))

        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError({"end_date": "End date must be after start date"})

        if student and start_date and end_date:
            overlapping = InternshipPlacement.objects.filter(
                student=student,
                start_date__lt=end_date,
                end_date__gt=start_date
            )
            if instance:
                overlapping = overlapping.exclude(pk=instance.pk)

            if overlapping.exists():
                raise serializers.ValidationError("This student already has a placement scheduled during the specified time period.")
        return data

