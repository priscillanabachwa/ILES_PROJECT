
from placements.models import InternshipPlacement
from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings

class WeeklyLogbook(models.Model):
    STATUS_CHOICE = [
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
    week_number = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    activities = models.TextField()
    challenges = models.TextField(blank=True)
    lesson = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICE,
        default = 'draft'
        )
    supervisor_comment = models.TextField(blank=True, null=True)
    deadline = models.DateField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    attachment = models.FileField(upload_to='log_attachments/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now =True)
    class Meta:
        unique_together=[['placement', 'week_number']]
        ordering = ['-week_number']

        permissions = [
            ('can_submit_weekly_log', 'Can submit weekly log'),
            ('can_review_weekly_log', 'Can review weekly log'),
            ('can_approve_weekly_log', 'Can approve weekly log'),
            ('can_reject_weekly_log', 'Can reject weekly log'),
        ]
        
    def __str__(self):
        return f'week{self.week_number} log for {self.placement}'

class LogBookReview(models.Model):
    logbook = models.ForeignKey(WeeklyLogbook, on_delete=models.CASCADE, related_name='reviews')
    supervisor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    comment = models.TextField()
    status_at_review = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Review by {self.supervisor} on {self.logbook}'