from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from .models import CustomUserManager, CustomUser, PasswordResetOTP
import random


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
            "is_active",
        ]
        read_only_fields = ["id", "is_staff", "is_superuser", "is_active"]

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

        instance = super().update(instance,validated_data)
        
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
    
# Password Reset Serializers

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            CustomUser.objects.get(email=value.lower())
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("No account found with this email.")
        return value.lower()

    def save(self):
        from .sms import send_sms

        user = CustomUser.objects.get(email=self.validated_data['email'])

        # Generate 5 digit OTP
        otp_code = str(random.randint(10000, 99999))

        # Save OTP to database
        PasswordResetOTP.objects.create(user=user, otp=otp_code)
        
        # Send email with OTP
        send_mail(
            subject='Your password reset OTP for ILES',
            message=f'Hello {user.first_name} {user.last_name},\n\nYour recovery code is: {otp_code}\n\nit expires in 10 minutes. Do not share with anyone.',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            fail_silently=False,
        )

        # SMS with OTP
        if user.phone_number:
            send_sms(
                user.phone_number,
                f"Hello {user.first_name} {user.last_name}, "
                f"your ILES password reset OTP is {otp_code}. "
                f"It expires in 10 minutes. Do not share this code with anyone."
            )


class PasswordResetVerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=5)

    def validate(self, attrs):
        try:
            user = CustomUser.objects.get(email=attrs['email'].lower())
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("No account found with this email.")

        try:
            otp_obj = PasswordResetOTP.objects.filter(
                user=user,
                otp=attrs['otp'],
                is_used=False
            ).latest('created_at')
        except PasswordResetOTP.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP.")

        if otp_obj.is_expired():
            raise serializers.ValidationError("OTP has expired. Please request a new one.")

        attrs['user'] = user
        attrs['otp_obj'] = otp_obj
        return attrs


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=5)
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, attrs):
        try:
            user = CustomUser.objects.get(email=attrs['email'].lower())
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("No account found with this email.")

        try:
            otp_obj = PasswordResetOTP.objects.filter(
                user=user,
                otp=attrs['otp'],
                is_used=False
            ).latest('created_at')
        except PasswordResetOTP.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP.")

        if otp_obj.is_expired():
            raise serializers.ValidationError("OTP has expired. Please request a new one.")

        attrs['user'] = user
        attrs['otp_obj'] = otp_obj
        return attrs

    def save(self):
        user = self.validated_data['user']
        otp_obj = self.validated_data['otp_obj']

        
        user.set_password(self.validated_data['new_password'])
        user.save()

        
        otp_obj.is_used = True
        otp_obj.save()