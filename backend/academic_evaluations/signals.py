from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AcademicEvaluation
from django.core.mail import send_mail
from django.conf import settings
from .sms import send_sms


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
         # SMS notification
        if student.phone_number:
            send_sms(
                student.phone_number,
                f"Hello {student.first_name} {student.last_name}, "
                f"your internship evaluation results are out. "
                f"Total Score: {instance.total_score}, Grade: {instance.grade}. "
                f"Login to the website to view full details."
            )