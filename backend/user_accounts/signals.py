from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser
from django.core.mail import send_mail
from django.conf import settings

@receiver(post_save, sender=CustomUser)
def send_welcome_email(sender, instance, created, **kwargs):
    if created:
        subject = 'Welcome to ILES!'
        message = f'Hello {instance.first_name},\n\nYour account for the Internship Logging and Evaluation System (ILES) has been created successfully. We are excited to have you on board.\n\nBest regards'
        from_email = settings.EMAIL_HOST_USER
        recipient_list = [instance.email]
        
        send_mail(
            subject= subject,
            message= message,
            from_email= settings.EMAIL_HOST_USER,
            recipient_list= recipient_list,
            fail_silently=False,
        )