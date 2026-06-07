import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def logbook_quality_to_log_stage(apps, schema_editor):
    EvaluationCriteria = apps.get_model('academic_evaluations', 'EvaluationCriteria')
    EvaluationCriteria.objects.filter(
        name='Logbook Quality and Depth',
        evaluator_type='academic',
    ).update(evaluation_stage='log')


def logbook_quality_to_any_stage(apps, schema_editor):
    EvaluationCriteria = apps.get_model('academic_evaluations', 'EvaluationCriteria')
    EvaluationCriteria.objects.filter(
        name='Logbook Quality and Depth',
        evaluator_type='academic',
    ).update(evaluation_stage='any')


class Migration(migrations.Migration):

    dependencies = [
        ('academic_evaluations', '0007_onsite_visit_any_stage'),
        ('weekly_logs', '0007_remove_workplace_comment'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Expand evaluation_stage choices to include 'log'
        migrations.AlterField(
            model_name='evaluationcriteria',
            name='evaluation_stage',
            field=models.CharField(
                choices=[
                    ('log',   'Weekly Log'),
                    ('any',   'Any Time'),
                    ('final', 'End of Internship'),
                ],
                default='any',
                max_length=10,
            ),
        ),

        # 2. Set Logbook Quality to 'log' stage
        migrations.RunPython(logbook_quality_to_log_stage, logbook_quality_to_any_stage),

        # 3. Add nullable log FK to AcademicEvaluation
        migrations.AddField(
            model_name='academicevaluation',
            name='log',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='evaluations',
                to='weekly_logs.weeklylogbook',
            ),
        ),

        # 4. Remove the old unique_together constraint
        migrations.AlterUniqueTogether(
            name='academicevaluation',
            unique_together=set(),
        ),

        # 5. Add conditional unique constraints
        migrations.AddConstraint(
            model_name='academicevaluation',
            constraint=models.UniqueConstraint(
                condition=models.Q(log__isnull=False),
                fields=['log', 'evaluator'],
                name='unique_log_evaluation',
            ),
        ),
        migrations.AddConstraint(
            model_name='academicevaluation',
            constraint=models.UniqueConstraint(
                condition=models.Q(log__isnull=True),
                fields=['placement', 'evaluator'],
                name='unique_placement_evaluation',
            ),
        ),
    ]
