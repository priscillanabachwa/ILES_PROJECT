from rest_framework import serializers
from .models import CustomUser
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = '__all__'
        extra_kwargs = {
            'password':{'write_only':True},
            'phone_number':{'write_only': True},
            'email':{'write_only':True}
        }
         