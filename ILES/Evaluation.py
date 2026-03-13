from django.db import models


class AcademicEvaluation(models.Model):

    placement = models.OneToOneField(
        'ILES.InternshipPlacement',  #  app name
        on_delete=models.CASCADE,
        related_name='academic_evaluation'
    )

    academic_supervisor = models.ForeignKey(
        'auth.User',
        on_delete=models.PROTECT,
        related_name='academic_evaluations_given'
    )

    technical_score = models.PositiveIntegerField()
    communication_score = models.PositiveIntegerField()
    professionalism_score = models.PositiveIntegerField()

    final_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    overall_comments = models.TextField(blank=True)

    recommended_grade = models.CharField(
        max_length=2,
        choices=[
            ('A', 'A - Excellent'),
            ('B+', 'B+ - Very Good'),
            ('B', 'B - Good'),
            ('C+', 'C+ - Fair'),
            ('C', 'C - Satisfactory'),
            ('D+', 'D+ - Weak Pass'),
            ('D', 'D - Pass'),
            ('F', 'F - Fail'),
        ],
        blank=True
    )

    evaluated_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    is_finalized = models.BooleanField(default=False)

    def __str__(self):
        return f"Academic Evaluation – {self.placement}"

    def save(self, *args, **kwargs):

        # Prevent editing after finalization
        if self.is_finalized and self.pk:
            return

        # Ensure scores are between 0 and 100
        for score in [self.technical_score, self.communication_score, self.professionalism_score]:
            if score < 0 or score > 100:
                raise ValueError("Scores must be between 0 and 100.")

        # Calculate final score
        self.final_score = (
            self.technical_score * 0.4 +
            self.communication_score * 0.3 +
            self.professionalism_score * 0.3
        )

        # Automatically assign grade
        self.recommended_grade = self.get_grade_letter()

        super().save(*args, **kwargs)

    def get_grade_letter(self):
        if self.final_score is None:
            return "N/A"
        if self.final_score >= 80:
            return "A"
        elif self.final_score >= 75:
            return "B+"
        elif self.final_score >= 70:
            return "B"
        elif self.final_score >= 65:
            return "C+"
        elif self.final_score >= 60:
            return "C"
        elif self.final_score >= 55:
            return "D+"
        elif self.final_score >= 50:
            return "D"
        else:
            return "F"