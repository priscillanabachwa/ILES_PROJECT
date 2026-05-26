from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Remove the workplace_comment field and the unused workplace_reviewed status choice.
    Workplace supervisors only VIEW logbooks — they do not comment on them.
    Their feedback is recorded via evaluation overall_comment instead.
    """

    dependencies = [
        ('weekly_logs', '0006_fix_supervisor_comment_nullable'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='weeklylogbook',
            name='workplace_comment',
        ),
        migrations.AlterField(
            model_name='weeklylogbook',
            name='status',
            field=models.CharField(
                choices=[
                    ('draft', 'Draft'),
                    ('submitted', 'Submitted'),
                    ('reviewed', 'Reviewed'),
                    ('approved', 'Approved'),
                ],
                default='draft',
                max_length=20,
            ),
        ),
    ]
