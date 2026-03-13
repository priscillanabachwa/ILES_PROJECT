from django.contrib.auth.models import AbstractUser
from django.db import models
from .models import InternshipPlacement,CustomUser

# Create your models here.
class AcademicEvaluation(models.Model):
    placement=models.ForeignKey(InternshipPlacement, on_delete=models.CASCADE)
    evaluator=models.ForeignKey(CustomUser,on_delete=models.CASCADE)
    supervisor_score=models.DecimalField(max_digits=5,decimal_places=2,default=0)
    technical_skills=models.IntegerField(default=0)
    communication_skills=models.IntegerField(default=0)
    problem_solving=models.IntegerField(default=0)
    attendance=models.IntegerField(default=0)
    total_score=models.DecimalField(max_digits=5, decimal_places=2,blank=True,null=True)
    overall_comment=models.TextField()
    date_and_time_evaluated=models.DateTimeField(auto_now_add=True)
    
    def save(self,*args,**kwargs):
        self.total_score=(self.technical_skills+self.communication_skills
                          +self.problem_solving+ self.attendance+self.supervisor_score)
        super().save(*args,**kwargs)
    
    def __str__(self):
        return f"Evaluation for{self.placement}-Total:{self.total_score}"
    
    
