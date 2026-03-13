from django.contrib.auth.models import AbstractUser
from django.db import models
from .models import InternshipPlacement

# Create your models here.
#CUSTOM USER MODEL
class CustomUser(AbstractUser):
    ROLES =[
        
        ('intern_admin', 'Internship Administrator'),
        ('academic_supervisor', 'Acadmemic Supervisor'),
        ('workplace_supervisor', 'Workplace Supervisor'),        
        ('student', 'Student Intern'),
        
    ]
    role = models.CharField(
        max_length = 40,
        choices = ROLES,
        default = 'student'
    )
    phone = models.CharField(max_length=13, blank = True)
    id_no = models.CharField(max_length = 20)
    def __str__ (self):
        return f"{self.username} ({self.role})" 

#INTERNSHIP PLACEMENT MODEL
class InternshipPlacements(models.Model):
    STATUS =[
        ()
    ]
#WEEKLY LOGIN MODEL
class WeeklyLog(models.Model):
    STATUS_CHOICE =[
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('approved', 'Approved'),
    ]

    internship = models.ForeignKey(
        InternshipPlacement,
        on_delete = models.CASCADE,
        related_name = 'logs'
    )
    week_number = models.PositiveIntegerField()
    activities = models.TextField()
    challenges = models.TextField(blank=True)
    lesson = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICE,
        default = 'draft'
        )
    supervisor_comment = models.TextField(blank=True)
    deadline = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now =True)
    class Meta:
        unique_together=[['internship', 'week_number']]
        
    def __str__(self):
        return f'week{self.week_number} log for {self.internship}'

     