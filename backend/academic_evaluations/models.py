from django.db import models
from django.conf import settings
from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone
from django.core.exceptions import ValidationError

class EvaluationCriteria(models.Model):
    EVALUATOR_TYPE_CHOICES = [('academic', 'Academic'), ('workplace', 'Workplace')]
    STAGE_CHOICES = [
        ('log',   'Weekly Log'),
        ('any',   'Any Time'),
        ('final', 'End of Internship'),
    ]

    name              = models.CharField(max_length=100, unique=True)
    description       = models.TextField(blank=True, null=True)
    max_score         = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    weight            = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_active         = models.BooleanField(default=True)
    evaluator_type    = models.CharField(max_length=20, choices=EVALUATOR_TYPE_CHOICES, default='academic')
    evaluation_stage  = models.CharField(max_length=10, choices=STAGE_CHOICES, default='any')

    def __str__(self):
        return f'{self.name} (weight:{self.weight})'

class AcademicEvaluation(models.Model):
    STATUS_CHOICES   = [('DRAFT', 'Draft'), ('SUBMITTED', 'Submitted')]
    activity_choices = [('true', 'True'),   ('false', 'False')]

    placement = models.ForeignKey(
        'placements.InternshipPlacement',
        on_delete=models.CASCADE,
        related_name='evaluations',
    )

    log = models.ForeignKey(
        'weekly_logs.WeeklyLogbook',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='evaluations',
    )

    evaluator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='evaluations',
    )

    total_score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    grade       = models.CharField(max_length=10, blank=True, null=True)
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    overall_comment = models.TextField(blank=True, null=True)
    submitted_at    = models.DateTimeField(blank=True, null=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    is_active       = models.BooleanField(default=True, choices=activity_choices)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                condition=models.Q(log__isnull=False),
                fields=['log', 'evaluator'],
                name='unique_log_evaluation',
            ),
            models.UniqueConstraint(
                condition=models.Q(log__isnull=True),
                fields=['placement', 'evaluator'],
                name='unique_placement_evaluation',
            ),
        ]
        permissions = [
            ('can_submit_academic_evaluation', 'Can submit academic evaluation'),
            ('can_view_academic_evaluation',   'Can view their own academic evaluation'),
            ('can_edit_academic_evaluation',   'Can edit academic evaluation'),
        ]

    def calculate_total_score(self):
        items = self.items.select_related('criteria').all()

        if self.log:
            if not items:
                return Decimal('0')
            item = items[0]
            if item.criteria.max_score > 0:
                return (item.score / item.criteria.max_score * 100).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
            return Decimal('0')

        total = Decimal('0')
        for item in items:
            if item.score and item.criteria.weight:
                total += (item.score * item.criteria.weight) / Decimal('100')
        return total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def get_grade(self):
        score = self.calculate_total_score()
        if score >= 80: return 'A'
        if score >= 70: return 'B'
        if score >= 60: return 'C'
        if score >= 50: return 'D'
        return 'F'

    def is_complete(self):
        return self.items.count() > 0

    def save(self, *args, **kwargs):
        if self.status == 'SUBMITTED':
            if not self.is_complete():
                raise ValidationError("Please score at least one criterion before submitting.")
            if not self.submitted_at:
                self.submitted_at = timezone.now()
            self.total_score = self.calculate_total_score()
            self.grade       = self.get_grade()
        super().save(*args, **kwargs)

    def __str__(self):
        if self.log:
            return f"Log eval — Week {self.log.week_number} for {self.placement} — Score:{self.total_score}"
        return f"Placement eval for {self.placement} — Score:{self.total_score}"

class EvaluationScore(models.Model):
    evaluation = models.ForeignKey(AcademicEvaluation, on_delete=models.CASCADE, related_name='items')
    criteria   = models.ForeignKey(EvaluationCriteria, on_delete=models.CASCADE, related_name='criteria_scores')
    score      = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        unique_together = ('evaluation', 'criteria')

    def clean(self):
        if self.score > self.criteria.max_score:
            raise ValidationError(f"Score cannot exceed max score ({self.criteria.max_score})")

    def __str__(self):
        return f"{self.criteria.name}: {self.score}"
