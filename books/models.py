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
