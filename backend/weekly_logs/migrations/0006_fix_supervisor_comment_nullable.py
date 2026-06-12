from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('weekly_logs', '0005_weeklylogbook_workplace_comment_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql='SELECT 1;',
            reverse_sql='SELECT 1;',
        ),
    ]
