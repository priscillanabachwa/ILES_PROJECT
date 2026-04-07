from placements.models import InternshipPlacement
from user_accounts.models import  CustomUser
from django.db import models
from django.conf import settings
from decimal import Decimal
     
class AcademicEvaluation(models.Model):
    placement=models.ForeignKey(InternshipPlacement, on_delete=models.CASCADE)
    evaluator=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='evaluations')
    supervisor_score=models.DecimalField(max_digits=5,decimal_places=2,default=0)
    academic_score=models.DecimalField(max_digits=5,decimal_places=2,default=0)
    logbook_score=models.DecimalField(max_digits=5,decimal_places=2,default=0)
    total_score=models.DecimalField(max_digits=5, decimal_places=2,default = 0, blank=True, null=True)
    overall_comment=models.TextField()
    evaluated_at=models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together=[['placement','evaluator']] 
        ordering =['-evaluated_at']
    
    def save(self,*args,**kwargs):
        #Calculating the weighted score based on the provided scores and there respective weights
        self.total_score=(
            (self.supervisor_score *('0.60'))+
            (self.academic_score *('0.20'))+
            (self.logbook_score *('0.20'))
        )
        super().save(*args,**kwargs)
        
    def __str__(self):
        return f"Evaluation for {self.placement} -Total:{self.total_score}"

