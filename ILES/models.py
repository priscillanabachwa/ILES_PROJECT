from django.contrib.auth.models import AbstractUser
from django.db import models
from .models import InternshipPlacement

# Create your models here.
class CustomUser(AbstractUser):
    pass

class InternshipPlacement(models.Model):
    STATUS_CHOICE = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('completed','Completed'),
    ]

    student = models.ForeignKey(
        CustomUser,
        on_delete = models.CASCADE,
        related_name='placements',
        limit_choices_to ={'role': 'student'}
    )
    workplace_supervisor = models.ForeignKey(
        CustomUser,
        on_delete = models.SET_NULL,
        null = True,
        related_name = 'supervised_placements',
        limit_choices_to ={'role': 'workplace_supervisor'}
    )
    academic_supervisor = models.ForeignKey(
        CustomUser,
        on_delete = models.SET_NULL,
        null=True,
        related_name = 'academic_placements',
        limit_choices_to={'role': 'academic_supervisor'}
    )
    
    company_name = models.CharField(max_length=200)
    company_address = models.TextField(blank=True)
    position = models.CharField(max_length = 100)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICE,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.student.username} at {self.company_name} as {self.position}'

        
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
    deadline = models.DateField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now =True)
    class Meta:
        unique_together=[['internship', 'week_number']]
        
    def __str__(self):
        return f'week{self.week_number} log for {self.internship}'

     