from django.db import models
from django.conf import settings
from decimal import Decimal
from django.utils import timezone
from django.core.exceptions import ValidationError



class EvaluationCriteria(models.Model):
    name=models.CharField(max_length=100,unique=True)
    description=models.TextField(blank=True,null=True)
    max_score=models.DecimalField(max_digits=5,decimal_places=2,default=0)
    weight=models.DecimalField(max_digits=5,decimal_places=2,default=0)
    is_active= models.BooleanField(default=True)
    
    def __str__(self):
        return f'{self.name} (weight:{self.weight})'
    


class AcademicEvaluation(models.Model):
    STATUS_CHOICES=[('DRAFT','Draft'),('SUBMITTED','Submitted')]
    activity_choices = [('true','True'),('false','False')]
    placement=models.ForeignKey(
        'placements.InternshipPlacement', 
         on_delete=models.CASCADE,
         related_name='evaluations'
    )

    evaluator=models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='evaluations'
    )

    total_score=models.DecimalField(
        max_digits=5, decimal_places=2,
        blank=True, null=True
    )
    grade=models.CharField(
        max_length=2,
        blank=True,null=True
    )
    status=models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT'
    )
    overall_comment=models.TextField(
        blank=True,
        null=True
    )
    submitted_at=models.DateTimeField(
        blank=True,
        null=True
    )
    submitted_at=models.DateTimeField(
        auto_now_add=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default =True, choices = activity_choices)

    class Meta:
        unique_together=[['placement','evaluator']] 
        ordering =['-created_at']
        
    def calculate_total_score(self):
        total = Decimal('0')
        items = self.items.select_related('criteria').all()

        for item in items:
            if item.score and item.criteria.weight:
                total += (item.score * item.criteria.weight) / Decimal('100')

        return total
        total_score = Decimal('0')
        total_weight =Decimal('0')
        items = self.items.select_related('criteria').all()

        for item in items:
            total_score += item.score *item.criteria.weight
            total_weight +=item.criteria.weight
        if total_weight >0:
            return total_score / total_weight
        return Decimal('0')
    
    def get_grade(self):
        if self.total_score is None:
            return None
        score=self.calculate_total_score()
        if score >= 80:
            return 'A'
        elif score >= 70:
            return 'B'
        elif score >=60:
            return 'C'
        elif score >= 50:
            return 'D'
        else:
            return 'F'
        
#ensuring all criteria are filled before submission
    def is_complete(self):
        total_criteria=EvaluationCriteria.objects.filter(is_active=True).count
        return self.items.count() == total_criteria
        
    def save(self, *args, **kwargs):
        if self.status == 'SUBMITTED':
            
            if not self.is_complete():
                raise ValidationError("All Criteria must be scored before submission")
            if not self.submitted_at:
                self.submitted_at=timezone.now()
            self.total_score = self.calculate_total_score()
            self.grade= self.get_grade()

        super().save(*args, **kwargs)    
        
    def __str__(self):
        return f"Evaluation for {self.placement} - Total:{self.total_score}"
    
class EvaluationScore(models.Model):
    evaluation=models.ForeignKey(AcademicEvaluation,on_delete=models.CASCADE,related_name='items')
    criteria=models.ForeignKey(EvaluationCriteria,on_delete=models.CASCADE,related_name='criteria_scores')
    score=models.DecimalField(max_digits=5,decimal_places=2)
    
    class Meta:
        unique_together=('evaluation','criteria')
    def clean(self):
        if self.score > self.criteria.max_score:
            raise ValidationError(f"Score cannot exceed max score ({self.criteria.max_score})")
     
    def __str__(self):
        return f"{self.criteria.name}:{self.score}"
        return f"{self.criteria.name}:{self.score}"
