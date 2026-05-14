from rest_framework import serializers
from datetime import date
from .models import WeeklyLogbook, LogBookReview


class LogbookReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogBookReview
        fields = [ 'supervisor', 'comment', 'status_at_review', 'created_at']

class WeeklyLogbookSerializer(serializers.ModelSerializer):
    attachment_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = WeeklyLogbook
        fields = [
            'id', 'placement', 'week_number', 'activities',
            'challenges', 'lesson', 'status', 'workplace_comment',
            'supervisor_comment', 'deadline', 'submitted_at', 'attachment', 'attachment_url'
        ]
        read_only_fields = ['id', 'submitted_at', 'workplace_comment', 'supervisor_comment', 'deadline', 'attachment_url']

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None
        request = self.context.get('request')
        url = obj.attachment.url
        return request.build_absolute_uri(url) if request else url

    def validate_week_number(self, value):
        if value <= 0:
            raise serializers.ValidationError("Week number must be a positive integer.")
        return value

    def validate(self, data):
        if data.get('status') == 'submitted':
            current_deadline = getattr(self.instance, 'deadline', None)
            if current_deadline and date.today() > current_deadline:
                raise serializers.ValidationError(
                    'Cannot submit a log after the deadline'
                )
        if self.instance and self.instance.status == 'approved':
            raise serializers.ValidationError(
                'Approved logs cannot be modified.'
            )
        return data
