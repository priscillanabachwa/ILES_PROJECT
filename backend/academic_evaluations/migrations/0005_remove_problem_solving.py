from django.db import migrations


def remove_problem_solving(apps, schema_editor):
    EvaluationCriteria = apps.get_model('academic_evaluations', 'EvaluationCriteria')

    # Delete Problem Solving (weight 15)
    EvaluationCriteria.objects.filter(
        name='Problem Solving',
        evaluator_type='workplace',
    ).delete()

    # Redistribute its 15% weight — split evenly between Technical Skills (30→37)
    # and Communication Skills (20→28), giving Time Management the extra 1 → 35/28/22/15
    # Simplest clean split: Technical 35, Professional Conduct 25, Communication 25, Time Management 15
    weight_map = {
        'Technical Skills':      35,
        'Professional Conduct':  25,
        'Communication Skills':  25,
        'Time Management':       15,
    }
    for name, weight in weight_map.items():
        EvaluationCriteria.objects.filter(name=name, evaluator_type='workplace').update(weight=weight)


def reverse_problem_solving(apps, schema_editor):
    EvaluationCriteria = apps.get_model('academic_evaluations', 'EvaluationCriteria')

    EvaluationCriteria.objects.get_or_create(
        name='Problem Solving',
        defaults={
            'description': 'Ability to identify, analyse, and resolve challenges encountered during the internship.',
            'max_score': 100, 'weight': 15, 'evaluator_type': 'workplace', 'is_active': True,
        },
    )
    # Restore original weights
    weight_map = {
        'Technical Skills':     30,
        'Professional Conduct': 20,
        'Communication Skills': 20,
        'Time Management':      15,
    }
    for name, weight in weight_map.items():
        EvaluationCriteria.objects.filter(name=name, evaluator_type='workplace').update(weight=weight)


class Migration(migrations.Migration):

    dependencies = [
        ('academic_evaluations', '0004_remove_academic_criteria'),
    ]

    operations = [
        migrations.RunPython(remove_problem_solving, reverse_problem_solving),
    ]
