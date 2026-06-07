from django.db import migrations


def onsite_to_any(apps, schema_editor):
    EvaluationCriteria = apps.get_model('academic_evaluations', 'EvaluationCriteria')
    EvaluationCriteria.objects.filter(
        name='On-site Visit',
        evaluator_type='academic',
    ).update(evaluation_stage='any')


def onsite_to_final(apps, schema_editor):
    EvaluationCriteria = apps.get_model('academic_evaluations', 'EvaluationCriteria')
    EvaluationCriteria.objects.filter(
        name='On-site Visit',
        evaluator_type='academic',
    ).update(evaluation_stage='final')


class Migration(migrations.Migration):

    dependencies = [
        ('academic_evaluations', '0006_onsite_visit_and_stage'),
    ]

    operations = [
        migrations.RunPython(onsite_to_any, onsite_to_final),
    ]
