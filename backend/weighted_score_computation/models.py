
from django.db import models
from internship_placement.models import InternshipPlacement
from django.core.validators import MinValueValidator, MaxValueValidator



class WeightedScoreComputation(models.Model):
    placement = models.ForeignKey(InternshipPlacement,
    on_delete=models.CASCADE,
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
            ('A','A'),
            ('B+','B+'),
            ('B','B'),
            ('C+','C+'),
            ('C','C'),
            ('D+','D+'),
            ('D','D'),
            ('F','F')
        ],
        blank=True
    )

    def compute_weighted_score(self):
        return (
            (self.technical_score * 0.4) +
            (self.communication_score * 0.3) +
            (self.professionalism_score * 0.3)
        )

    def assign_grade(self):

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
        elif self.final_score is None:
            return "F"

    def save(self, *args, **kwargs):

        # compute weighted score
        self.final_score = self.compute_weighted_score()

        # assign grade automatically
        self.grade = self.assign_grade()

        super().save(*args, **kwargs)