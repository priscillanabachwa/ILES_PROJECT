from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class Company(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class InternshipPlacement(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='student_placements'
    )

    company = models.ForeignKey(
        Company,
        on_delete=models.PROTECT,
        related_name='placements'
    )

    workplace_supervisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='workplace_supervisions'
    )

    academic_supervisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='academic_supervisions'
    )

    start_date = models.DateField()
    end_date = models.DateField()

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    description = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student} - {self.company}"

    # 🔥 VALIDATION (IMPORTANT)
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
