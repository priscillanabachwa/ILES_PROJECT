from django.db import migrations


def remove_criteria(apps, schema_editor):
    EvaluationCriteria = apps.get_model('academic_evaluations', 'EvaluationCriteria')

    # Delete the two removed criteria
    EvaluationCriteria.objects.filter(
        name__in=['Academic Alignment', 'Site Visit / Interview Performance'],
        evaluator_type='academic',
    ).delete()

    # Redistribute weights for the remaining academic criteria
    weight_map = {
        'Logbook Quality and Depth':      50,
        'Final Internship Report':        25,
        'Theory-to-Practice Application': 25,
    }
    for name, weight in weight_map.items():
        EvaluationCriteria.objects.filter(name=name, evaluator_type='academic').update(weight=weight)


def reverse_criteria(apps, schema_editor):
    """Restore the two criteria if the migration is reversed."""
    EvaluationCriteria = apps.get_model('academic_evaluations', 'EvaluationCriteria')

    EvaluationCriteria.objects.get_or_create(
        name='Academic Alignment',
        defaults={
            'description': 'Alignment of internship activities with programme objectives and intended learning outcomes.',
            'max_score': 100, 'weight': 13, 'evaluator_type': 'academic', 'is_active': True,
        },
    )
    EvaluationCriteria.objects.get_or_create(
        name='Site Visit / Interview Performance',
        defaults={
            'description': 'Performance during the academic supervisor site visit or structured interview assessment.',
            'max_score': 100, 'weight': 12, 'evaluator_type': 'academic', 'is_active': True,
        },
    )

    # Restore original weights
    weight_map = {
        'Final Internship Report':        13,
        'Theory-to-Practice Application': 12,
    }
    for name, weight in weight_map.items():
        EvaluationCriteria.objects.filter(name=name, evaluator_type='academic').update(weight=weight)


class Migration(migrations.Migration):

    dependencies = [
        ('academic_evaluations', '0003_evaluationcriteria_evaluator_type_and_seed'),
    ]

    operations = [
        migrations.RunPython(remove_criteria, reverse_criteria),
    ]
