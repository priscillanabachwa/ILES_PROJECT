from django.db import migrations, models


def seed_criteria(apps, schema_editor):
    EvaluationCriteria = apps.get_model('academic_evaluations', 'EvaluationCriteria')
    EvaluationCriteria.objects.all().delete()

    criteria = [
        # Workplace supervisor criteria — contributes 40% of the final grade
        {
            'name': 'Technical Skills',
            'description': 'Ability to apply technical knowledge and skills relevant to the internship field.',
            'max_score': 100, 'weight': 30, 'evaluator_type': 'workplace',
        },
        {
            'name': 'Professional Conduct',
            'description': 'Professionalism, workplace ethics, and adherence to company policies.',
            'max_score': 100, 'weight': 20, 'evaluator_type': 'workplace',
        },
        {
            'name': 'Communication Skills',
            'description': 'Effectiveness in verbal and written communication with colleagues and supervisors.',
            'max_score': 100, 'weight': 20, 'evaluator_type': 'workplace',
        },
        {
            'name': 'Problem Solving',
            'description': 'Ability to identify, analyse, and resolve challenges encountered during the internship.',
            'max_score': 100, 'weight': 15, 'evaluator_type': 'workplace',
        },
        {
            'name': 'Time Management',
            'description': 'Punctuality, meeting deadlines, and effective use of work time.',
            'max_score': 100, 'weight': 15, 'evaluator_type': 'workplace',
        },

        # Academic supervisor criteria — contributes 60% of the final grade
        # Logbook alone = 30% of the final grade (weight 50 within the 60% academic portion)
        {
            'name': 'Logbook Quality and Depth',
            'description': 'Quality, consistency, and depth of weekly log entries throughout the internship. Accounts for 30% of the final grade.',
            'max_score': 100, 'weight': 50, 'evaluator_type': 'academic',
        },
        {
            'name': 'Final Internship Report',
            'description': 'Comprehensiveness, structure, and quality of the final internship report.',
            'max_score': 100, 'weight': 25, 'evaluator_type': 'academic',
        },
        {
            'name': 'Theory-to-Practice Application',
            'description': 'Evidence of applying academic theory and course knowledge to real workplace situations.',
            'max_score': 100, 'weight': 25, 'evaluator_type': 'academic',
        },
    ]

    for c in criteria:
        EvaluationCriteria.objects.create(**c)


def reverse_seed(apps, schema_editor):
    EvaluationCriteria = apps.get_model('academic_evaluations', 'EvaluationCriteria')
    EvaluationCriteria.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('academic_evaluations', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='evaluationcriteria',
            name='evaluator_type',
            field=models.CharField(
                choices=[('academic', 'Academic'), ('workplace', 'Workplace')],
                default='academic',
                max_length=20,
            ),
        ),
        migrations.RunPython(seed_criteria, reverse_seed),
    ]
