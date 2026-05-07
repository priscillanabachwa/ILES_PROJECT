from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import WeeklyLogbook
from django.core.mail import send_mail
from django.conf import settings    


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