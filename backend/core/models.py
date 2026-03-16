from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class User(AbstractUser):
    # for the roles
   # class Types(models.TextChoices):
    #    WORKPLACE_SUPERVISOR = "WORKPLACE_SUPERVISOR", "Workplace_supervisor"
        #ACADEMIC_SUPERVISOR = "ACADEMIC_SUPERVISOR", "Academic_sspervisor"
     is_supervisor = models.BooleanField(default=False)
  #  type = models.CharField(
   #     max_length=25, choices=Types.choices, default=Types.ACADEMIC_SUPERVISOR
    #)
class Student(models.Model):      
    email = models.EmailField(unique=True, max_length=60)
    username = models.CharField(unique=True, max_length=25)
    #linking each student to a specific supervisor
    supervisor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='assigned_students',
        limit_choices_to={'is_supervisor': True}
    )

#    note = models.TextField(max_length=200, null=True, blank=True)

   # USERNAME_FIELD = "email"
    #REQUIRED_FIELDS = ["username"]

   # def __str__(self):
    #    return self.email
    def __str__(self):
         return self.name 
    
class WeeklyLog(models.Model):
     Student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='logs')
     week_number = models.PositiveIntegerField()
     content = models.TextField #full content logs
     submission_date = models.DateTimeField(auto_now_add=True)
     is_reviewed = models.BooleanField(default=False)
     

     def __str__(self):
          return f"{self.student.name} - week{self.week_number}"
     
# allows a supervisor to add review comment
class WeeklyLog(models.Model):
     Student = models.ForeignKey('Student', on_delete=models.CASCADE)
     content = models.TextField ()
     supervisor_comment = models.TextField(blank=True, null=True)
     is_reviewed = models.BooleanField(default=False)
     reviewed_at = models.DateTimeField(null=True, blank=True)
     

     def __str__(self):
          return f"Log for {self.student.name}"
     




"""for an academic supervisor to be able to login and view all the students
that are being supervised to monitor progress.
here the student model is linked to the supervisor(user) and 
WeeklyLog is linked to the student"""

from django.db import models
from django.conf import settings

class Student(models.Model):
     user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
     academic_supervisor = models.ForeignKey(
          settings.AUTH_USER_MODEL,
          null=True,
          related_name='supervised_students'
     )  
     internship_company = models.CharField(max_length=200)



     def __init__(self):
          self.user.get_full_name()



      #to allow an academic supervisor to officially approve a reviewed log
      # add an academic approval boolean and a timestamp to the WeeklyLog model
      # setting default=False ensures logs must be eexplicitly approved
      #   
from django.db import models
from django.utils import timezone


class WeeklyLog(models.Model):
     academic_approval = models.BooleanField(default=False)
     approval_date = models.DateTimeField(null=True, blank=True)
     academic_notes = models.TextField(blank=True, null=True)
    

     def approve(self):
          """custom method to handle the approval logic"""
          self.academic_approval = True
          self.approval_date = timezone.now()
          self.save 