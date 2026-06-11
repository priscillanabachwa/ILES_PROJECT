from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('weekly_logs', '0005_weeklylogbook_workplace_comment_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql='-- SQLite does not support ALTER COLUMN. This migration is a no-op for SQLite.',
            reverse_sql='-- no-op',
        ),
    ]
