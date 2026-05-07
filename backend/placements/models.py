from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class Company(models.Model):
    company_name = models.CharField(max_length=200)
    company_address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name


class InternshipPlacement(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_placements',
        limit_choices_to ={'role': 'student'}
    )

    company = models.ForeignKey(
        'Company',
        on_delete=models.PROTECT,
        related_name='placements'
    )

    workplace_supervisor = models.ForeignKey(
        'user_accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='workplace_supervisions',
        limit_choices_to ={'role': 'workplace_supervisor'}
    )

    academic_supervisor = models.ForeignKey(
        'user_accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='academic_supervisions',
        limit_choices_to={'role': 'academic_supervisor'}
    )

    start_date = models.DateField()
    end_date = models.DateField()

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='PENDING'
    )


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student} - {self.company.company_name}"

    #  VALIDATION (IMPORTANT)
    def clean(self):
        from django.core.exceptions import ValidationError

        # End date must be after start date
        if self.end_date <= self.start_date:
            raise ValidationError("End date must be after start date")

        # Prevent overlapping placements for same student
        overlapping = InternshipPlacement.objects.filter(
            student=self.student,
            start_date__lt=self.end_date,
            end_date__gt=self.start_date
        ).exclude(id=self.id)

        if overlapping.exists():
            raise ValidationError("Student already has an overlapping placement")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'status'],
                condition=models.Q(status='ACTIVE'),
                name='unique_active_placement_per_student'
            )
        ]
        permissions = [
            ("can_request_placements", "Can request placements"),
            ("can_approve_placements", "Can approve placements"),
            ("can_manage_placements", "Can manage placements"),
        ]