from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('weekly_logs', '0005_weeklylogbook_workplace_comment_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql='ALTER TABLE weekly_logs_weeklylogbook ALTER COLUMN supervisor_comment DROP NOT NULL;',
            reverse_sql='ALTER TABLE weekly_logs_weeklylogbook ALTER COLUMN supervisor_comment SET NOT NULL;',
        ),
    ]
