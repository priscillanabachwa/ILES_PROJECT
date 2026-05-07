from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Placement
from django.core.mail import send_mail
from django.conf import settings                                                                                                                              
from .sms import send_sms

@receiver(post_save, sender=Placement)
def notify_on_update(sender, instance, created, **kwargs):
    if not created:
        # Logic for creating notification when a placement is updated
        send_mail(
            subject='Placement Updated',
            message=f'The placement for {instance.student} has been updated.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[instance.student.email],
            fail_silently=False,
        )
        
        # SMS notification
        if instance.student.phone_number:
            status_messages = {
                'ACTIVE': f"Hello {instance.student.first_name} {instance.student.last_name}, your internship at {instance.company.company_name} is now ACTIVE. Good luck!",
                'COMPLETED': f"Hello {instance.student.first_name} {instance.student.last_name}, your internship at {instance.company.company_name} is COMPLETED. Congratulations!",
                'CANCELLED': f"Hello {instance.student.first_name}{instance.student.last_name}, your internship at {instance.company.company_name} has been CANCELLED. Please contact your supervisor.",
            }
            message = status_messages.get(instance.status)
            if message:
                send_sms(instance.student.phone_number, message)
    
        