
from rest_framework import serializers
from .models import WeeklyLogbook


class WeeklyLogbookSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = WeeklyLogbook
        fields = '__all__'

        read_only_fields = ['created_at','submitted_at','updated_at']

    def validate(self, date):
        if 'status' in data and data ['status'] == 'submitted':
            if data.get('deadline') and date.today() > data['deadline']:
                raise serializers.ValidationError(
                    'Cannot submit a log after the deadline'
                )
        
        if self.instance and self.instance.status == 'approved':
            raise serializers.ValidationError(
                'Cannot edit an approved log'
            )
    
        return data