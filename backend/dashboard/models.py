from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta




class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        STUDENT              = 'student',              'Student Intern'
        WORKPLACE_SUPERVISOR = 'workplace_supervisor', 'Workplace Supervisor'
        ACADEMIC_SUPERVISOR  = 'academic_supervisor',  'Academic Supervisor'
        ADMIN                = 'admin',                'Internship Administrator'

    role            = models.CharField(max_length=30, choices=Role.choices, default=Role.STUDENT)
    phone_number    = models.CharField(max_length=15, blank=True)
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        blank=True,
        null=True
    )
    organisation    = models.CharField(max_length=200, blank=True)
    student_number  = models.CharField(max_length=20, blank=True, unique=True, null=True)
    last_login_role = models.CharField(max_length=30, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

    def save(self, *args, **kwargs):
        self.last_login_role = self.role
        super().save(*args, **kwargs)

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

    def get_dashboard_url(self):
        routes = {
            self.Role.STUDENT:              '/dashboard/student',
            self.Role.WORKPLACE_SUPERVISOR: '/dashboard/supervisor',
            self.Role.ACADEMIC_SUPERVISOR:  '/dashboard/academic',
            self.Role.ADMIN:                '/dashboard/admin',
        }
        return routes.get(self.role, '/')

    
    def unread_notification_count(self):
        return self.notifications.filter(is_read=False).count()



class InternshipPlacement(models.Model):
    class Status(models.TextChoices):
        PENDING   = 'pending',   'Pending'
        ACTIVE    = 'active',    'Active'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    student = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE,
        related_name='placements',
        limit_choices_to={'role': CustomUser.Role.STUDENT}
    )
    workplace_supervisor = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='supervised_placements',
        limit_choices_to={'role': CustomUser.Role.WORKPLACE_SUPERVISOR}
    )
    academic_supervisor = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='academic_placements',
        limit_choices_to={'role': CustomUser.Role.ACADEMIC_SUPERVISOR}
    )
    company_name    = models.CharField(max_length=200)
    company_address = models.TextField(blank=True)
    position        = models.CharField(max_length=100)
    department      = models.CharField(max_length=200, blank=True)
    start_date      = models.DateField()
    end_date        = models.DateField()
    status          = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']

    def clean(self):
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValidationError("End date must be after start date.")

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
        return f"{self.student.username} at {self.company_name} as {self.position}"


    @property
    def progress_percentage(self):
        today = timezone.now().date()
        if today < self.start_date:
            return 0
        if today >= self.end_date:
            return 100
        total_days   = (self.end_date - self.start_date).days
        elapsed_days = (today - self.start_date).days
        return round((elapsed_days / total_days) * 100, 1)

    @property
    def days_remaining(self):
        today = timezone.now().date()
        remaining = (self.end_date - today).days
        return max(remaining, 0)

    @property
    def total_weeks(self):
        return max((self.end_date - self.start_date).days // 7, 1)


    def get_log_summary(self):
        logs = self.weekly_logs.all()
        counts = {
            'total':     logs.count(),
            'draft':     logs.filter(status='draft').count(),
            'submitted': logs.filter(status='submitted').count(),
            'reviewed':  logs.filter(status='reviewed').count(),
            'approved':  logs.filter(status='approved').count(),
        }
        counts['missing'] = self.total_weeks - counts['total']
        return counts



class WeeklyLog(models.Model):
    class Status(models.TextChoices):
        DRAFT     = 'draft',     'Draft'
        SUBMITTED = 'submitted', 'Submitted'
        REVIEWED  = 'reviewed',  'Reviewed'
        APPROVED  = 'approved',  'Approved'

    placement          = models.ForeignKey(
        InternshipPlacement, on_delete=models.CASCADE,
        related_name='weekly_logs'
    )
    week_number        = models.PositiveIntegerField()
    activities         = models.TextField(help_text="Describe activities carried out this week.")
    challenges         = models.TextField(blank=True, help_text="Any challenges faced.")
    lesson             = models.TextField(blank=True, help_text="What did you learn?")
    supervisor_comment = models.TextField(blank=True)
    status             = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    deadline           = models.DateField(null=True, blank=True)
    submitted_at       = models.DateTimeField(null=True, blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('placement', 'week_number')
        ordering = ['week_number']

    def clean(self):
        if self.pk:
            original = WeeklyLog.objects.filter(pk=self.pk).first()
            if original and original.status == self.Status.APPROVED:
                raise ValidationError("Cannot edit a log that has already been approved.")

        if self.status == self.Status.SUBMITTED and self.deadline:
            if timezone.now().date() > self.deadline:
                raise ValidationError("Submission deadline has passed.")

    def save(self, *args, **kwargs):
        if self.status == self.Status.SUBMITTED and not self.submitted_at:
            self.submitted_at = timezone.now()
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Week {self.week_number} log for {self.placement} [{self.status}]"

    
    @property
    def is_overdue(self):
        if self.deadline and self.status in [self.Status.DRAFT]:
            return timezone.now().date() > self.deadline
        return False

    @property
    def is_due_soon(self):
        if self.deadline and self.status == self.Status.DRAFT:
            days_left = (self.deadline - timezone.now().date()).days
            return 0 <= days_left <= 2
        return False

    @property
    def days_until_deadline(self):
        if self.deadline:
            return (self.deadline - timezone.now().date()).days
        return None



class SupervisorReview(models.Model):
    class Decision(models.TextChoices):
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected (Return to Draft)'

    weekly_log  = models.OneToOneField(
        WeeklyLog, on_delete=models.CASCADE,
        related_name='supervisor_review'
    )
    supervisor  = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True,
        related_name='reviews_given',
        limit_choices_to={'role': CustomUser.Role.WORKPLACE_SUPERVISOR}
    )
    comments    = models.TextField(blank=True)
    decision    = models.CharField(max_length=20, choices=Decision.choices)
    reviewed_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.weekly_log.status != WeeklyLog.Status.SUBMITTED:
            raise ValidationError("Can only review a log that has been submitted.")
        super().save(*args, **kwargs)

        if self.decision == self.Decision.APPROVED:
            self.weekly_log.status = WeeklyLog.Status.REVIEWED
        elif self.decision == self.Decision.REJECTED:
            self.weekly_log.status = WeeklyLog.Status.DRAFT

        if self.comments:
            self.weekly_log.supervisor_comment = self.comments

        self.weekly_log.save(update_fields=['status', 'supervisor_comment'])

    def __str__(self):
        return f"Review of {self.weekly_log} by {self.supervisor} – {self.decision}"


class StatusHistory(models.Model):

    weekly_log = models.ForeignKey(
        WeeklyLog, on_delete=models.CASCADE,
        related_name='status_history'
    )
    changed_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True
    )
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    note       = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return (
            f"{self.weekly_log} | {self.old_status} → {self.new_status} "
            f"by {self.changed_by} at {self.changed_at:%Y-%m-%d %H:%M}"
        )




class Notification(models.Model):
    class NotificationType(models.TextChoices):
        LOG_SUBMITTED      = 'log_submitted',      'Log Submitted'
        LOG_REVIEWED       = 'log_reviewed',        'Log Reviewed'
        LOG_APPROVED       = 'log_approved',        'Log Approved'
        LOG_REJECTED       = 'log_rejected',        'Log Rejected — Revision Required'
        PLACEMENT_ASSIGNED = 'placement_assigned',  'Placement Assigned'
        EVALUATION_READY   = 'evaluation_ready',    'Evaluation Ready'
        ANNOUNCEMENT       = 'announcement',        'New Announcement'

    recipient         = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    message           = models.TextField()
    is_read           = models.BooleanField(default=False)
    weekly_log        = models.ForeignKey(
        WeeklyLog, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='notifications'
    )
    placement         = models.ForeignKey(
        InternshipPlacement, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='notifications'
    )
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        read_status = 'Read' if self.is_read else 'Unread'
        return f"Notification → {self.recipient.username}: {self.notification_type} ({read_status})"

    @classmethod
    def notify(cls, recipient, notification_type, message, weekly_log=None, placement=None):
        return cls.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            message=message,
            weekly_log=weekly_log,
            placement=placement,
        )




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


class AcademicEvaluation(models.Model):
    placement        = models.ForeignKey(
        InternshipPlacement, on_delete=models.CASCADE,
        related_name='academic_evaluations'
    )
    evaluator        = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE,
        related_name='evaluations',
        limit_choices_to={'role': CustomUser.Role.ACADEMIC_SUPERVISOR}
    )
    supervisor_score = models.DecimalField(max_digits=5, decimal_places=2, default=0,
                                           validators=[MinValueValidator(0), MaxValueValidator(100)])
    academic_score   = models.DecimalField(max_digits=5, decimal_places=2, default=0,
                                           validators=[MinValueValidator(0), MaxValueValidator(100)])
    logbook_score    = models.DecimalField(max_digits=5, decimal_places=2, default=0,
                                           validators=[MinValueValidator(0), MaxValueValidator(100)])
    total_score      = models.DecimalField(max_digits=5, decimal_places=2, default=0, blank=True, null=True)
    overall_comment  = models.TextField(blank=True)
    evaluated_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['placement', 'evaluator']]
        ordering = ['-evaluated_at']

    def save(self, *args, **kwargs):
        self.total_score = (
            (self.supervisor_score * 0.60) +
            (self.academic_score   * 0.20) +
            (self.logbook_score    * 0.20)
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Evaluation for {self.placement} - Total: {self.total_score}"



class WeightedScoreComputation(models.Model):
    placement = models.ForeignKey(
        InternshipPlacement, on_delete=models.CASCADE,
        related_name='weighted_scores'
    )
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
            ('A', 'A'), ('B+', 'B+'), ('B', 'B'),
            ('C+', 'C+'), ('C', 'C'), ('D+', 'D+'),
            ('D', 'D'), ('F', 'F'),
        ],
        blank=True
    )
    computed_at = models.DateTimeField(auto_now=True)

    def compute_weighted_score(self):
        return (
            (self.technical_score       * 0.4) +
            (self.communication_score   * 0.3) +
            (self.professionalism_score * 0.3)
        )

    def assign_grade(self):
        if   self.final_score >= 80: return 'A'
        elif self.final_score >= 75: return 'B+'
        elif self.final_score >= 70: return 'B'
        elif self.final_score >= 65: return 'C+'
        elif self.final_score >= 60: return 'C'
        elif self.final_score >= 55: return 'D+'
        elif self.final_score >= 50: return 'D'
        else:                        return 'F'

    def save(self, *args, **kwargs):
        self.final_score = self.compute_weighted_score()
        self.grade       = self.assign_grade()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.placement.student.username} - "
            f"Final: {self.final_score} ({self.grade})"
        )



class EvaluationScore(models.Model):
    evaluation = models.ForeignKey(
        AcademicEvaluation, on_delete=models.CASCADE,
        related_name='scores'
    )
    criteria   = models.ForeignKey(EvaluationCriteria, on_delete=models.CASCADE)
    score      = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Raw score out of 100."
    )

    class Meta:
        unique_together = ('evaluation', 'criteria')

    def __str__(self):
        return f"{self.evaluation} | {self.criteria.name}: {self.score}"



class Announcement(models.Model):
    class TargetRole(models.TextChoices):
        ALL                  = 'all',                  'All Users'
        STUDENT              = 'student',              'Student Interns Only'
        WORKPLACE_SUPERVISOR = 'workplace_supervisor', 'Workplace Supervisors Only'
        ACADEMIC_SUPERVISOR  = 'academic_supervisor',  'Academic Supervisors Only'
        ADMIN                = 'admin',                'Administrators Only'

    title       = models.CharField(max_length=200)
    body        = models.TextField()
    target_role = models.CharField(
        max_length=30, choices=TargetRole.choices, default=TargetRole.ALL,
        help_text="Which role(s) will see this announcement on their dashboard."
    )
    created_by  = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True,
        related_name='announcements_created',
        limit_choices_to={'role': CustomUser.Role.ADMIN}
    )
    is_active   = models.BooleanField(default=True)
    expiry_date = models.DateField(
        null=True, blank=True,
        help_text="Announcement stops showing after this date. Leave blank to show indefinitely."
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.target_role}] {self.title}"

    @property
    def is_expired(self):
        if self.expiry_date:
            return timezone.now().date() > self.expiry_date
        return False

    @classmethod
    def active_for_role(cls, role):
        today = timezone.now().date()
        return cls.objects.filter(
            is_active=True,
            target_role__in=[role, cls.TargetRole.ALL],
        ).filter(
            models.Q(expiry_date__isnull=True) | models.Q(expiry_date__gte=today)
        )



class StudentFeedback(models.Model):
    class Rating(models.IntegerChoices):
        VERY_POOR  = 1, '1 - Very Poor'
        POOR       = 2, '2 - Poor'
        AVERAGE    = 3, '3 - Average'
        GOOD       = 4, '4 - Good'
        EXCELLENT  = 5, '5 - Excellent'

    placement       = models.OneToOneField(
        InternshipPlacement, on_delete=models.CASCADE,
        related_name='student_feedback'
    )
    overall_rating  = models.IntegerField(
        choices=Rating.choices,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    mentorship_rating = models.IntegerField(
        choices=Rating.choices,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="How well was the student mentored?"
    )
    workload_rating = models.IntegerField(
        choices=Rating.choices,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Was the workload appropriate?"
    )
    comments        = models.TextField(
        blank=True,
        help_text="Any additional comments about the internship experience."
    )
    would_recommend = models.BooleanField(
        default=True,
        help_text="Would the student recommend this organisation to others?"
    )
    submitted_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

    def clean(self):
        # Feedback can only be submitted after the internship is completed
        if self.placement.status != InternshipPlacement.Status.COMPLETED:
            raise ValidationError(
                "Feedback can only be submitted after the internship is marked as completed."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"Feedback from {self.placement.student.username} "
            f"- {self.overall_rating}★ ({self.placement.company_name})"
        )




class LogAttachment(models.Model):
    class FileType(models.TextChoices):
        IMAGE    = 'image',    'Image'
        PDF      = 'pdf',      'PDF Document'
        DOCUMENT = 'document', 'Word / Other Document'
        OTHER    = 'other',    'Other'

    weekly_log    = models.ForeignKey(
        WeeklyLog, on_delete=models.CASCADE,
        related_name='attachments'
    )
    uploaded_by   = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True,
        related_name='log_attachments'
    )
    file          = models.FileField(upload_to='log_attachments/%Y/%m/')
    file_type     = models.CharField(
        max_length=20, choices=FileType.choices, default=FileType.OTHER
    )
    description   = models.CharField(
        max_length=200, blank=True,
        help_text="Brief description of what this file shows."
    )
    uploaded_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def clean(self):
        # Block uploads on approved logs
        if self.weekly_log.status == WeeklyLog.Status.APPROVED:
            raise ValidationError("Cannot add attachments to an approved log.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"Attachment for {self.weekly_log} "
            f"by {self.uploaded_by} [{self.file_type}]"
        )



class DashboardSummary(models.Model):
   
    total_students          = models.PositiveIntegerField(default=0)
    total_placements        = models.PositiveIntegerField(default=0)
    active_placements       = models.PositiveIntegerField(default=0)
    completed_placements    = models.PositiveIntegerField(default=0)
    total_logs_submitted    = models.PositiveIntegerField(default=0)
    total_logs_approved     = models.PositiveIntegerField(default=0)
    total_logs_pending      = models.PositiveIntegerField(default=0)
    total_evaluations       = models.PositiveIntegerField(default=0)
    average_final_score     = models.DecimalField(
        max_digits=5, decimal_places=2, default=0
    )
    last_updated            = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Dashboard Summary'
        verbose_name_plural = 'Dashboard Summary'

    def __str__(self):
        return f"Dashboard Summary (last updated: {self.last_updated:%Y-%m-%d %H:%M})"

    @classmethod
    def refresh(cls):
     
        from django.db.models import Avg

        summary, _ = cls.objects.get_or_create(pk=1)
        summary.total_students       = CustomUser.objects.filter(role='student').count()
        summary.total_placements     = InternshipPlacement.objects.count()
        summary.active_placements    = InternshipPlacement.objects.filter(status='active').count()
        summary.completed_placements = InternshipPlacement.objects.filter(status='completed').count()
        summary.total_logs_submitted = WeeklyLog.objects.filter(status='submitted').count()
        summary.total_logs_approved  = WeeklyLog.objects.filter(status='approved').count()
        summary.total_logs_pending   = WeeklyLog.objects.filter(status__in=['draft', 'submitted']).count()
        summary.total_evaluations    = AcademicEvaluation.objects.count()
        avg = WeightedScoreComputation.objects.aggregate(avg=Avg('final_score'))['avg']
        summary.average_final_score  = round(avg, 2) if avg else 0
        summary.save()
        return summary
