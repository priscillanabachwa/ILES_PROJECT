from django.db import migrations
from datetime import date


SEMESTERS = [
    # (year, semester, start_date, end_date, is_active)
    (2024, 'I',  date(2024, 1, 1),  date(2024, 6, 30),  False),
    (2024, 'II', date(2024, 7, 1),  date(2024, 12, 31), False),
    (2025, 'I',  date(2025, 1, 1),  date(2025, 6, 30),  False),
    (2025, 'II', date(2025, 7, 1),  date(2025, 12, 31), False),
    (2026, 'I',  date(2026, 1, 1),  date(2026, 6, 30),  False),
    (2026, 'II', date(2026, 7, 1),  date(2026, 12, 31), True),   # current
]


def seed_semesters(apps, schema_editor):
    Semester = apps.get_model('placements', 'Semester')
    for year, semester, start, end, is_active in SEMESTERS:
        Semester.objects.get_or_create(
            year=year,
            semester=semester,
            defaults=dict(start_date=start, end_date=end, is_active=is_active),
        )


def unseed_semesters(apps, schema_editor):
    Semester = apps.get_model('placements', 'Semester')
    Semester.objects.filter(year__in=[2024, 2025, 2026]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('placements', '0006_semester'),
    ]

    operations = [
        migrations.RunPython(seed_semesters, unseed_semesters),
    ]
