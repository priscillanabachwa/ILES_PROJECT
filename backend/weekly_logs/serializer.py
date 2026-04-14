
from rest_framework import serializers
from .models import WeeklyLogbook


class WeeklyLogbookSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = WeeklyLogbook
<<<<<<< HEAD
        fields = [
            'id', 'internship_id', 'week_number', 'activities', 
            'challenges', 'lesson', 'status', 'supervisor_comment', 
            'deadline', 'submitted_at'
        ]
        read_only_fields = ['created_at','submitted_at','updated_at','status','supervisor_comment','deadline']
    def validate_week_number(self,value):
            if value <=0:
                return "week number cannot be negative"
    def validate_log(self,data):
         if self.instance and self.status == 'approved':
              raise serializers.ValidationError("Approved log cannot be modified")
         
         return data  
=======
        fields = '__all__'

        read_only_fields = ['created_at','submitted_at','updated_at']

    def validate(self, date):
        if 'status' in date and date ['status'] == 'submitted':
            if date.get('deadline') and date.today() > date['deadline']:
                raise serializers.ValidationError(
                    'Cannot submit a log after the deadline'
                )
        
        if self.instance and self.instance.status == 'approved':
            raise serializers.ValidationError(
                'Cannot edit an approved log'
            )
    
        return date 
>>>>>>> c356e9fcc2b1368c2e2414deaebcf8c5ab34c3b6
