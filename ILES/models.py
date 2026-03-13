from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone


class UserProfile(models.Model):
    """
    Extends Django User with role for our system
    """
    ROLE_CHOICES = (
        ('STUDENT', 'Student Intern'),
        ('ADMIN', 'Internship Administrator'),
        ('WORKPLACE_SUPERVISOR', 'Workplace Supervisor'),
        ('ACADEMIC_SUPERVISOR', 'Academic Supervisor'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=15, blank=True, null=True)
    department = models.CharField(max_length=120, blank=True)

    