from django.contrib import admin

# Register your models here.
from .models import (
    CustomUser,
    InternshipPlacement,
    WeeklyLogbook,
    AcademicEvaluation,
    WeightedScoreComputation
)

admin.site.register(CustomUser)
admin.site.register(InternshipPlacement)
admin.site.register(WeeklyLogbook)
admin.site.register(AcademicEvaluation)
admin.site.register(WeightedScoreComputation)
