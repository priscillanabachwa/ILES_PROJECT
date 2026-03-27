
from abstract_user.models import CustomUser
from django.db import models


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

        

