from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import InternshipPlacement
from django.core.mail import send_mail
from django.conf import settings

@receiver(post_save, sender=InternshipPlacement)
def notify_on_update(sender, instance, created, **kwargs):
    if not created:
        # Logic for creating notification when a placement is updated
        send_mail(
            subject='InternshipPlacement Updated',
            message=f'The placement for {instance.student} has been updated.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[instance.student.email],
            fail_silently=False,
        )
        