from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('placements', '0005_internshipplacement_placement_letter'),
    ]

    operations = [
        migrations.CreateModel(
            name='Semester',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.IntegerField()),
                ('semester', models.CharField(choices=[('I', 'Semester I'), ('II', 'Semester II')], max_length=5)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('is_active', models.BooleanField(default=False)),
            ],
            options={
                'ordering': ['-year', 'semester'],
                'unique_together': {('year', 'semester')},
            },
        ),
    ]
