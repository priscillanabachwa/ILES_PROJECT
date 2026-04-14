
from placements.models import InternshipPlacement
from django.db import models

class WeeklyLogbook(models.Model):
    STATUS_CHOICE =[
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('approved', 'Approved'),
    ]

    placement = models.ForeignKey(
        InternshipPlacement,
        on_delete = models.CASCADE,
        related_name = 'weekly_logs'
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
        unique_together=[['placement', 'week_number']]
        
    def __str__(self):
        return f'week{self.week_number} log for {self.internship}'