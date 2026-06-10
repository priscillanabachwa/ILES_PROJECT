from django.db import migrations, models


def apply_onsite_and_stages(apps, schema_editor):
    EvaluationCriteria = apps.get_model('academic_evaluations', 'EvaluationCriteria')

    # Rename Theory-to-Practice Application → On-site Visit
    EvaluationCriteria.objects.filter(
        name='Theory-to-Practice Application',
        evaluator_type='academic',
    ).update(
        name='On-site Visit',
        description=(
            'Assessment of the student\'s performance and engagement observed '
            'during the academic supervisor\'s on-site visit to the workplace.'
        ),
        evaluation_stage='final',
    )

    # Final Internship Report → final stage
    EvaluationCriteria.objects.filter(
        name='Final Internship Report',
        evaluator_type='academic',
    ).update(evaluation_stage='final')

    # Logbook Quality stays at 'any' (already the default — explicit for clarity)
    EvaluationCriteria.objects.filter(
        name='Logbook Quality and Depth',
        evaluator_type='academic',
    ).update(evaluation_stage='any')

    # Workplace criteria → final (supervisor evaluates at end of internship)
    EvaluationCriteria.objects.filter(
        evaluator_type='workplace',
    ).update(evaluation_stage='final')


def reverse_onsite_and_stages(apps, schema_editor):
    EvaluationCriteria = apps.get_model('academic_evaluations', 'EvaluationCriteria')

    EvaluationCriteria.objects.filter(
        name='On-site Visit',
        evaluator_type='academic',
    ).update(
        name='Theory-to-Practice Application',
        description=(
            'Evidence of applying academic theory and course knowledge '
            'to real workplace situations.'
        ),
        evaluation_stage='any',
    )

    EvaluationCriteria.objects.filter(
        name='Final Internship Report',
        evaluator_type='academic',
    ).update(evaluation_stage='any')


class Migration(migrations.Migration):

    dependencies = [
        ('academic_evaluations', '0005_remove_problem_solving'),
    ]

    operations = [
        migrations.AddField(
            model_name='evaluationcriteria',
            name='evaluation_stage',
            field=models.CharField(
                choices=[('any', 'Any Time'), ('final', 'End of Internship')],
                default='any',
                max_length=10,
            ),
        ),
        migrations.RunPython(apply_onsite_and_stages, reverse_onsite_and_stages),
    ]
