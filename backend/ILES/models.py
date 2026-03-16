from django.contrib.auth.models import AbstractUser
from django.db import models
from .models import CustomUser
from django.core.validators import MinValueValidator, MaxValueValidator


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

        
class WeeklyLogbook(models.Model):
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

     
class AcademicEvaluation(models.Model):
    placement=models.ForeignKey(InternshipPlacement, on_delete=models.CASCADE)
    evaluator=models.ForeignKey(CustomUser,on_delete=models.CASCADE,related_name='evaluations')
    Supervisor_score=models.DecimalField(max_digit=5,decimal_places=2,default=0)
    academic_score=models.DecimalField(max_digits=5,decimal_places=2,default=0)
    logbook_score=models.DecimalField(max_digits=5,decimal_places=2,default=0)
    total_score=models.DecimalField(max_digits=5, decimal_places=2,blank=True,null=True)
    overall_comment=models.TextField()
    evaluated_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together=[['placement','evaluator']] 
        ordering =['-evaluated_at']
    
    def save(self,*args,**kwargs):
        self.total_score=(self.supervisor_score*60/100+self.academic_score*20/100+self.logbook_score*20/100)
        super().save(*args,**kwargs)
        
    def __str__(self):
        return f"Evaluation for{self.Placement}-Total:{self.total_score}"

class WeightedScoreComputation(models.Model):

    technical_score = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    communication_score = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    professionalism_score = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    final_score = models.FloatField(null=True, blank=True)

    grade = models.CharField(
        max_length=2,
        choices=[
            ('A','A'),
            ('B+','B+'),
            ('B','B'),
            ('C+','C+'),
            ('C','C'),
            ('D+','D+'),
            ('D','D'),
            ('F','F')
        ],
        blank=True
    )

    def compute_weighted_score(self):
        return (
            (self.technical_score * 0.4) +
            (self.communication_score * 0.3) +
            (self.professionalism_score * 0.3)
        )

    def assign_grade(self):

        if self.final_score >= 80:
            return "A"
        elif self.final_score >= 75:
            return "B+"
        elif self.final_score >= 70:
            return "B"
        elif self.final_score >= 65:
            return "C+"
        elif self.final_score >= 60:
            return "C"
        elif self.final_score >= 55:
            return "D+"
        elif self.final_score >= 50:
            return "D"
        else:
            return "F"

    def save(self, *args, **kwargs):

        # compute weighted score
        self.final_score = self.compute_weighted_score()

        # assign grade automatically
        self.grade = self.assign_grade()

        super().save(*args, **kwargs)