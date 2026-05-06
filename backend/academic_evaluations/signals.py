from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AcademicEvaluation
from django.core.mail import send_mail
from django.conf import settings


@receiver(post_save, sender=AcademicEvaluation)
def send_evaluation_notification(sender, instance, created, **kwargs):
    if created:
        # Send email notification to the student
        subject = 'Academic Evaluation Updated'
        message = f'Hello {instance.student.first_name},\n\nYour academic evaluation has been updated.'
        recipient_list = [instance.student.email]
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL, 
            recipient_list=[instance.student.email],
            fail_silently=False,
        )