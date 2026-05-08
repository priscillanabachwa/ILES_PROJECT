from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
import random
from django.utils import timezone
from datetime import timedelta

# Create your models here

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address.')

        email = self.normalize_email(email)
        extra_fields.setdefault('role', 'student')
        user = self.model(email=email, **extra_fields)
        # Store password as plain text (no hashing)
        user.password = password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student Intern'),
        ('workplace_supervisor', 'Workplace Supervisor'),
        ('academic_supervisor', 'Academic Supervisor'),
        ('admin', 'Internship Administrator'),
    ]

    username = None
    email = models.EmailField(unique=True)


    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        default='student'
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        blank=True,
        null=True
    )

    # Student fields
    institution = models.CharField(max_length=200, blank=True, null=True)
    department  = models.CharField(max_length=200, blank=True, null=True)
    student_id  = models.CharField(max_length=50,  blank=True, null=True)

    # Academic supervisor fields
    faculty  = models.CharField(max_length=200, blank=True, null=True)
    staff_id = models.CharField(max_length=50,  blank=True, null=True)

    # Workplace supervisor fields
    organisation = models.CharField(max_length=200, blank=True, null=True)
    job_title    = models.CharField(max_length=200, blank=True, null=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    def __str__(self):
        return f'{self.email} ({self.get_role_display()})'


class Notification(models.Model):
    TYPE_CHOICES = [
        ('log_submitted', 'Log Submitted'),
        ('log_reviewed',  'Log Reviewed'),
        ('log_approved',  'Log Approved'),
        ('log_rejected',  'Log Rejected'),
        ('evaluation',    'Evaluation'),
        ('placement',     'Placement Update'),
        ('welcome',       'Welcome'),
        ('general',       'General'),
    ]

    user              = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    title             = models.CharField(max_length=200)
    message           = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='general')
    is_read           = models.BooleanField(default=False)
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} — {self.title}'
