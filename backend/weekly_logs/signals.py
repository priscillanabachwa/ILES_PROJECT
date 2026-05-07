from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import WeeklyLogbook
from django.core.mail import send_mail
from django.conf import settings    

from django.contrib.auth.models import Group, Permission


@receiver(post_save, sender=WeeklyLogbook)
def notify_supervisor_on_submission(sender, instance, created, **kwargs):
    if created:
        # Logic for creating notification when a weekly logbook is submitted
        send_mail(
            subject='New Weekly Log Submitted',
            message=f'{instance.student} has submitted a new log for week {instance.week_number}.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[instance.supervisor.email],
            fail_silently=False,
        )
@receiver(post_migrate)
def create_groups(sender, **kwargs):
    student_group, _ = Group.objects.get_or_create(name='Student')
    workplace_group, _ = Group.objects.get_or_create(name='Workplace Supervisor')
    academic_group, _ = Group.objects.get_or_create(name='Academic Supervisor')
    admin_group, _ = Group.objects.get_or_create(name='Admin')
        
    #get permissions
    submit_permission = Permission.objects.get(codename='can_submit_weekly_log')
    review_permission = Permission.objects.get(codename='can_review_weekly_log')
    approve_permission = Permission.objects.get(codename='can_approve_weekly_log')

    #assign permissions to groups
    student_group.permissions.add(submit_permission)
    workplace_group.permissions.add(review_permission, approve_permission)
    academic_group.permissions.add(review_permission)
    
