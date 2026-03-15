from django.contrib.auth.models import AbstractUser
from django.db import models


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
        ('pending', 'Pending'),
        ('active',  'Active'),
        ('done', 'Done')
    ]
    student = models.ForeignKey(
        CustomUser,
        on_delete = models.CASCADE,
        related_name ='intern_placement',
        limit_choices_to={'role':'student'}
    )
    workplace_supervisor = models.ForeignKey(
        CustomUser,
        on_delete = models.SET_NULL,
        null = True,
        blank = True,
        related_name= 'placement_supervisor',
        limit_choices_to ={'role':'workplace_supervisor'}
    )
    academic_supervisor = models.ForeignKey(
        CustomUser,
        on_delete = models.SET_NULL,
        null = True,
        releated_name = "academic_placement",
        limit_choices_to= {"role":"academic_supervisor"}
    )
    company_name = models.TextField(),
    company_email= models.TextField(),
    start_date= models.DateField(),
    stop_date = models.DateField()
    status = models.CharField(
        max_length = 10,
        choices = STATUS,
        default = 'pending'
    )
    def __str__(self):
        return f'{self.student.username} is at {self.company_name}'

#WEEKLY LOGIN MODEL
class WeeklyLog(models.Model):
    STATUS_CHOICE =[
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('approved', 'Approved'),
    ]

    internship = models.ForeignKey(
        InternshipPlacements,
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
#MODEL FOR EVALUATIONS CRITEREA.
class Evaluation(models.Model):
   name = models.CharField(max_length= 60),
description = models.TextField(blank=True),
max_score = models.DecimalField( 
    default = 0,
    max_length = 5,
    decimal_places = 2)
weight_percentage = models.DecimalField(
     default = 0,
     max_length = 5,
     decimal_places = 2)
def __str__(self):
    return f"{self.name }  weight:{self.weight_percentage}%"
#MODEL FOR EVALUATION.
class Evaluation(models.Model):
    placement = models.ForeignKey (
        InternshipPlacements,
        on_delete = models.CASCADE,
        related_name = 'evaluations'
    )
    Evaluating = models.ForeignKey(
        CustomUser,
        on_delete= models.CASCADE,
        related_name = "available_evaluations"
    )
    supervisor_score = models.DecimalField(
        default = 0,
        max_length = 5,
        decimal_places = 2
    )
    academic_score =  models.DecimalField(
        default = 0,
        max_length = 5,
        decimal_places = 2
    )
    log_score =  models.DecimalField(
        default = 0,
        max_length = 5,
        decimal_places = 2
    )
    total_score = models.DecimalField(
        default = 0,
        max_length = 5,
        decimal_places = 2
    )
    evaluated_at = models.DateTimeField(auto_now_add= True)
    class Meta:
        unique_together = ['placement','Evaluating']
    def save(self,*args,**kwargs):
        self.total_score= (
             self.supervisor_score * 40/100 +
             self.academic_score * 30/100 +
             self.log_score * 30/100
          
        )
        super().save(*args,**kwargs)
    def __str__(self):
        return f"EValuation for {self.placement} - Total:{self.total_score}"