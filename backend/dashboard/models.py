from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone



# 1. CUSTOM USER & ROLE MANAGEMENT


class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        STUDENT             = 'student',              'Student Intern'
        WORKPLACE_SUPERVISOR = 'workplace_supervisor', 'Workplace Supervisor'
        ACADEMIC_SUPERVISOR  = 'academic_supervisor',  'Academic Supervisor'
        ADMIN               = 'admin',                'Internship Administrator'

    role            = models.CharField(max_length=30, choices=Role.choices)
    phone           = models.CharField(max_length=20, blank=True)
    organisation    = models.CharField(max_length=200, blank=True)  # for workplace supervisors
    student_number  = models.CharField(max_length=20, blank=True, unique=True, null=True)

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def is_student(self):
        return self.role == self.Role.STUDENT

    @property
    def is_workplace_supervisor(self):
        return self.role == self.Role.WORKPLACE_SUPERVISOR

    @property
    def is_academic_supervisor(self):
        return self.role == self.Role.ACADEMIC_SUPERVISOR

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN



# 2. INTERNSHIP PLACEMENT MODULE


class InternshipPlacement(models.Model):
    class Status(models.TextChoices):
        PENDING   = 'pending',   'Pending'
        ACTIVE    = 'active',    'Active'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    student              = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE,
        related_name='placements',
        limit_choices_to={'role': CustomUser.Role.STUDENT}
    )
    workplace_supervisor = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='supervised_placements',
        limit_choices_to={'role': CustomUser.Role.WORKPLACE_SUPERVISOR}
    )
    academic_supervisor  = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='academic_placements',
        limit_choices_to={'role': CustomUser.Role.ACADEMIC_SUPERVISOR}
    )
    organisation         = models.CharField(max_length=200)
    department           = models.CharField(max_length=200, blank=True)
    start_date           = models.DateField()
    end_date             = models.DateField()
    status               = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at           = models.DateTimeField(auto_now_add=True)
    updated_at           = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']

    def clean(self):
        # Validate date range
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValidationError("End date must be after start date.")

        # Prevent overlapping placements for the same student
        overlapping = InternshipPlacement.objects.filter(
            student=self.student,
            status__in=[self.Status.PENDING, self.Status.ACTIVE],
            start_date__lt=self.end_date,
            end_date__gt=self.start_date,
        ).exclude(pk=self.pk)

        if overlapping.exists():
            raise ValidationError("This student already has an overlapping placement.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} @ {self.organisation} ({self.start_date} – {self.end_date})"



# 3. WEEKLY LOGBOOK MODULE


class WeeklyLog(models.Model):
    class Status(models.TextChoices):
        DRAFT     = 'draft',     'Draft'
        SUBMITTED = 'submitted', 'Submitted'
        REVIEWED  = 'reviewed',  'Reviewed'
        APPROVED  = 'approved',  'Approved'

    placement        = models.ForeignKey(
        InternshipPlacement, on_delete=models.CASCADE,
        related_name='weekly_logs'
    )
    week_number      = models.PositiveIntegerField()
    activities       = models.TextField(help_text="Describe activities carried out this week.")
    challenges       = models.TextField(blank=True, help_text="Any challenges faced.")
    learning_outcome = models.TextField(blank=True, help_text="What did you learn?")
    status           = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    submitted_at     = models.DateTimeField(null=True, blank=True)
    deadline         = models.DateTimeField(null=True, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('placement', 'week_number')  # one log per week per placement
        ordering = ['week_number']

    def clean(self):
        # Prevent editing after approval
        if self.pk:
            original = WeeklyLog.objects.filter(pk=self.pk).first()
            if original and original.status == self.Status.APPROVED:
                raise ValidationError("Cannot edit a log that has already been approved.")

        # Enforce submission deadline
        if self.status == self.Status.SUBMITTED and self.deadline:
            if timezone.now() > self.deadline:
                raise ValidationError("Submission deadline has passed.")

    def save(self, *args, **kwargs):
        if self.status == self.Status.SUBMITTED and not self.submitted_at:
            self.submitted_at = timezone.now()
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Week {self.week_number} log – {self.placement.student} [{self.status}]"



# 4. SUPERVISOR REVIEW WORKFLOW


class SupervisorReview(models.Model):
    """Workplace supervisor reviews a weekly log."""

    class Decision(models.TextChoices):
        APPROVED  = 'approved',  'Approved'
        REJECTED  = 'rejected',  'Rejected (Return to Draft)'

    weekly_log   = models.OneToOneField(
        WeeklyLog, on_delete=models.CASCADE,
        related_name='supervisor_review'
    )
    supervisor   = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True,
        related_name='reviews_given',
        limit_choices_to={'role': CustomUser.Role.WORKPLACE_SUPERVISOR}
    )
    comments     = models.TextField(blank=True)
    decision     = models.CharField(max_length=20, choices=Decision.choices)
    reviewed_at  = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Enforce valid state transition: log must be in SUBMITTED state
        if self.weekly_log.status != WeeklyLog.Status.SUBMITTED:
            raise ValidationError(
                "Can only review a log that has been submitted."
            )
        super().save(*args, **kwargs)

        # Update the log status based on the decision
        if self.decision == self.Decision.APPROVED:
            self.weekly_log.status = WeeklyLog.Status.REVIEWED
        elif self.decision == self.Decision.REJECTED:
            self.weekly_log.status = WeeklyLog.Status.DRAFT

        self.weekly_log.save(update_fields=['status'])

    def __str__(self):
        return f"Review of {self.weekly_log} by {self.supervisor} – {self.decision}"


class StatusHistory(models.Model):
    """Audit trail: records every status change on a WeeklyLog."""

    weekly_log  = models.ForeignKey(
        WeeklyLog, on_delete=models.CASCADE,
        related_name='status_history'
    )
    changed_by  = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True
    )
    old_status  = models.CharField(max_length=20)
    new_status  = models.CharField(max_length=20)
    note        = models.TextField(blank=True)
    changed_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return (
            f"{self.weekly_log} | {self.old_status} → {self.new_status} "
            f"by {self.changed_by} at {self.changed_at:%Y-%m-%d %H:%M}"
        )



# 5. ACADEMIC EVALUATION MODULE


class EvaluationCriteria(models.Model):
   
    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    weight      = models.DecimalField(
        max_digits=5, decimal_places=2,
        help_text="Weight as a percentage, e.g. 40.00 for 40%"
    )
    is_active   = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Evaluation Criteria'

    def __str__(self):
        return f"{self.name} ({self.weight}%)"


class Evaluation(models.Model):
    """
    Academic supervisor scores a student's internship
    against each EvaluationCriteria.
    Total weighted score is auto-computed on save.
    """
    placement          = models.OneToOneField(
        InternshipPlacement, on_delete=models.CASCADE,
        related_name='evaluation'
    )
    academic_supervisor = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True,
        related_name='evaluations_given',
        limit_choices_to={'role': CustomUser.Role.ACADEMIC_SUPERVISOR}
    )
    total_score        = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Auto-computed weighted total."
    )
    grade              = models.CharField(max_length=5, blank=True)
    comments           = models.TextField(blank=True)
    is_submitted       = models.BooleanField(default=False)
    submitted_at       = models.DateTimeField(null=True, blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)

    def compute_total_score(self):
        """Computes weighted total from all EvaluationScores."""
        scores = self.scores.select_related('criteria').all()
        total = sum(
            (s.score * s.criteria.weight / 100)
            for s in scores
            if s.score is not None
        )
        return round(total, 2)

    def assign_grade(self, score):
        if score >= 80:   return 'A'
        elif score >= 70: return 'B'
        elif score >= 60: return 'C'
        elif score >= 50: return 'D'
        else:             return 'F'

    def save(self, *args, **kwargs):
        # Prevent duplicate submission
        if self.is_submitted and self.pk:
            original = Evaluation.objects.filter(pk=self.pk).first()
            if original and original.is_submitted:
                raise ValidationError("This evaluation has already been submitted and cannot be modified.")

        # Auto-compute score and grade on submission
        if self.is_submitted:
            self.total_score = self.compute_total_score()
            self.grade       = self.assign_grade(float(self.total_score))
            if not self.submitted_at:
                self.submitted_at = timezone.now()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Evaluation for {self.placement.student} – Score: {self.total_score}"


# 6. WEIGHTED SCORE COMPUTATION


class EvaluationScore(models.Model):
    """One score per criterion per evaluation."""
    evaluation = models.ForeignKey(
        Evaluation, on_delete=models.CASCADE,
        related_name='scores'
    )
    criteria   = models.ForeignKey(
        EvaluationCriteria, on_delete=models.CASCADE
    )
    score      = models.DecimalField(
        max_digits=5, decimal_places=2,
        help_text="Raw score out of 100."
    )

    class Meta:
        unique_together = ('evaluation', 'criteria')  # no duplicate scores per criterion

    def clean(self):
        if not (0 <= self.score <= 100):
            raise ValidationError("Score must be between 0 and 100.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.evaluation} | {self.criteria.name}: {self.score}"

from django.db import models

# Create your models here.
