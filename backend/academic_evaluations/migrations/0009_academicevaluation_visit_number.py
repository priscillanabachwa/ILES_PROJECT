from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academic_evaluations', '0008_log_evaluation_support'),
    ]

    operations = [
        # 1. Add visit_number field
        migrations.AddField(
            model_name='academicevaluation',
            name='visit_number',
            field=models.PositiveIntegerField(null=True, blank=True),
        ),

        # 2. Drop the old placement-level unique constraint
        #    (it covered log=null but didn't account for visit_number)
        migrations.RemoveConstraint(
            model_name='academicevaluation',
            name='unique_placement_evaluation',
        ),

        # 3. Re-add the report evaluation constraint
        #    (log=null AND visit_number=null → only one report eval per placement+evaluator)
        migrations.AddConstraint(
            model_name='academicevaluation',
            constraint=models.UniqueConstraint(
                condition=models.Q(log__isnull=True, visit_number__isnull=True),
                fields=['placement', 'evaluator'],
                name='unique_placement_evaluation',
            ),
        ),

        # 4. Add the visit evaluation constraint
        #    (log=null AND visit_number=N → unique per placement+evaluator+visit_number)
        migrations.AddConstraint(
            model_name='academicevaluation',
            constraint=models.UniqueConstraint(
                condition=models.Q(log__isnull=True, visit_number__isnull=False),
                fields=['placement', 'evaluator', 'visit_number'],
                name='unique_visit_evaluation',
            ),
        ),
    ]
