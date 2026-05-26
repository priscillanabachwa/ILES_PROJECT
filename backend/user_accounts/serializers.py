from rest_framework import serializers
from .models import CustomUser, Notification

class CustomUserSerializer(serializers.ModelSerializer):

    email = serializers.EmailField()
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    first_name   = serializers.CharField(required=False, allow_blank=True)
    last_name    = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    institution  = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    department   = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    student_id   = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    faculty      = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    staff_id     = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    organisation = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    job_title    = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone_number",
            "profile_picture",
            "password",
            "is_staff",
            "is_superuser",
            "is_active",
            "institution",
            "department",
            "student_id",
            "faculty",
            "staff_id",
            "organisation",
            "job_title",
        ]
        read_only_fields = ["id", "is_staff", "is_superuser", "is_active"]

    def validate(self, attrs):
        if not self.instance and not attrs.get('password'):
            raise serializers.ValidationError({"password": "Password is required for new users."})
        return attrs

    def validate_email(self, value):
        value = value.lower()
        if self.instance is None or self.instance.email != value:
            if CustomUser.objects.filter(email=value).exclude(id=self.instance.id if self.instance else None).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_role(self, value):
        roles = [choice[0] for choice in self.Meta.model.ROLE_CHOICES]
        if value not in roles:
            raise serializers.ValidationError("Invalid role.")
        return value

    def validate_password(self, value):
        if value and len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        email = validated_data.pop("email")
        user = CustomUser.objects.create_user(email=email, password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
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
        rep.pop("password", None)
        return rep

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'created_at']
        read_only_fields = ['id', 'title', 'message', 'notification_type', 'created_at']
