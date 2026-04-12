from django.contrib.auth.models import AbstractUser
from django.db import models
# from .managers import CustomUserManager     

class CustomUser(AbstractUser):
                ROLE_CHOICES = [
                    ('student', 'Student Intern'),
                    ('workplace_supervisor', 'Workplace Supervisor'),
                    ('academic_supervisor', 'Academic Supervisor'),
                    ('admin', 'Internship Administrator'),
                ]
                role = models.CharField(
                    max_length=30, 
                    choices=ROLE_CHOICES, 
                    default='student'
                )
                phone_number = models.CharField(max_length=15, blank=True)
                profile_picture = models.ImageField(
                    upload_to = 'profile_pictures/',
                    blank = True,
                    null = True
                )

                def __str__(self):
                    return f'{self.username} ({self.role})'   


                username = models.CharField(max_length=150, blank=True, null=True)
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
                USERNAME_FIELD = 'email'
                REQUIRED_FIELDS = ['first_name', 'last_name']

                objects = CustomUserManager()

                def __str__(self):
                    return f'{self.email} ({self.get_role_display()})'

from django.contrib.auth.models import AbstractUser
from django.db import models    