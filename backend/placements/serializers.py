from rest_framework import serializers
from .models import InternshipPlacement, Company
from user_accounts.models import CustomUser

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['created_at']

class InternshipPlacementSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = InternshipPlacement
        fields = [
            'id', 'student', 'student_name', 'company', 'company_name',
            'workplace_supervisor', 'academic_supervisor',
            'start_date', 'end_date', 'status'
        ]
        read_only_fields = [
            'status', 'workplace_supervisor', 'academic_supervisor',
            'start_date', 'end_date', 'created_at'
        ]

    def get_student_name(self, obj):
        u = obj.student
        return f"{u.first_name} {u.last_name}".strip() if u else ''

    def get_company_name(self, obj):
        return obj.company.company_name if obj.company else ''

class PlacementSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    company = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(), required=False, allow_null=True
    )
    company_name = serializers.SerializerMethodField()
    company_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_address = serializers.SerializerMethodField()
    workplace_supervisor_name = serializers.SerializerMethodField()
    workplace_supervisor_email = serializers.SerializerMethodField()
    academic_supervisor_name = serializers.SerializerMethodField()
    academic_supervisor_email = serializers.SerializerMethodField()

    placement_letter_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = InternshipPlacement
        fields = [
            'id', 'student', 'student_name',
            'company', 'company_name', 'company_name_input', 'company_address',
            'workplace_supervisor', 'workplace_supervisor_name', 'workplace_supervisor_email',
            'academic_supervisor', 'academic_supervisor_name', 'academic_supervisor_email',
            'start_date', 'end_date', 'status', 'created_at', 'updated_at',
            'placement_letter', 'placement_letter_url',
        ]

    def get_placement_letter_url(self, obj):
        if not obj.placement_letter:
            return None
        request = self.context.get('request')
        url = obj.placement_letter.url
        return request.build_absolute_uri(url) if request else url

    def get_student_name(self, obj):
        u = obj.student
        return f"{u.first_name} {u.last_name}".strip() if u else ''

    def get_company_name(self, obj):
        return obj.company.company_name if obj.company else ''

    def get_company_address(self, obj):
        return (obj.company.company_address or '') if obj.company else ''

    def get_workplace_supervisor_name(self, obj):
        u = obj.workplace_supervisor
        return f"{u.first_name} {u.last_name}".strip() if u else ''

    def get_workplace_supervisor_email(self, obj):
        return obj.workplace_supervisor.email if obj.workplace_supervisor else ''

    def get_academic_supervisor_name(self, obj):
        u = obj.academic_supervisor
        return f"{u.first_name} {u.last_name}".strip() if u else ''

    def get_academic_supervisor_email(self, obj):
        return obj.academic_supervisor.email if obj.academic_supervisor else ''

    def validate(self, data):
        instance = self.instance
        if not instance and not data.get('company') and not data.get('company_name_input'):
            raise serializers.ValidationError(
                {'company': 'Please select an existing company or enter a new company name.'}
            )

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
                raise serializers.ValidationError(
                    "This student already has a placement scheduled during the specified time period."
                )
        return data

    def create(self, validated_data):
        company_name = validated_data.pop('company_name_input', None)
        if company_name and not validated_data.get('company'):
            company, _ = Company.objects.get_or_create(company_name=company_name)
            validated_data['company'] = company
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('company_name_input', None)
        return super().update(instance, validated_data)
