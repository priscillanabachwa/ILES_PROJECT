

from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUserManager
from .models import CustomUser


class CustomUserSerializer(serializers.ModelSerializer):

    email = serializers.EmailField()
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "username",
            "role",
            "phone_number",
            "profile_picture",
            "password",
            "is_staff",
            "is_superuser",
        ]
        read_only_fields = ["id", "is_staff", "is_superuser"]

    def validate_email(self, value):

        return value.lower()

    def validate_role(self, value):
        roles = [choice[0] for choice in self.Meta.model.ROLE_CHOICES]
        if value not in roles:
            raise serializers.ValidationError("Invalid role.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        email = validated_data.pop("email")
        # Use manager to ensure default fields and proper creation
        user = CustomUser.objects.create_user(email=email, password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        # Avoid changing sensitive flags via this serializer
        validated_data.pop("is_staff", None)
        validated_data.pop("is_superuser", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        request = self.context.get("request")
        pic = None
        if instance.profile_picture and hasattr(instance.profile_picture, "url"):
            pic_url = instance.profile_picture.url
            if request is not None:
                pic_url = request.build_absolute_uri(pic_url)
            pic = pic_url
        rep["profile_picture"] = pic
        # Do not include password in representations
        rep.pop("password", None)
        return rep

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'}, trim_whitespace=False)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'),
                                email=email, password=password)

            if not user:
                msg = 'Unable to log in with provided credentials.'
                raise serializers.ValidationError(msg, code='authorization')

        else:
            msg = 'Must include "email" and "password".'
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs
