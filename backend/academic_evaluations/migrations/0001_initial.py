

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('placements', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='EvaluationCriteria',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('max_score', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('weight', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('is_active', models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name='AcademicEvaluation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_score', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('status', models.CharField(choices=[('DRAFT', 'Draft'), ('SUBMITTED', 'Submitted')], default='DRAFT', max_length=20)),
                ('overall_comment', models.TextField(blank=True, null=True)),
                ('submitted_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('evaluator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='evaluations', to=settings.AUTH_USER_MODEL)),
                ('placement', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='evaluations', to='placements.internshipplacement')),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('placement', 'evaluator')},
            },
        ),
        migrations.CreateModel(
            name='EvaluationScore',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('score', models.DecimalField(decimal_places=2, max_digits=5)),
                ('criteria', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='criteria_scores', to='academic_evaluations.evaluationcriteria')),
                ('evaluation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='academic_evaluations.academicevaluation')),
            ],
            options={
                'unique_together': {('evaluation', 'criteria')},
            },
        ),
    ]