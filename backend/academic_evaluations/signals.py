from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import AcademicEvaluation
from .sms import send_sms


@receiver(pre_save, sender=AcademicEvaluation)
def capture_evaluation_status(sender, instance, **kwargs):
    """Track previous status to detect DRAFT → SUBMITTED transition."""
    if instance.pk:
        try:
            instance._prev_status = AcademicEvaluation.objects.get(pk=instance.pk).status
        except AcademicEvaluation.DoesNotExist:
            instance._prev_status = None
    else:
        instance._prev_status = None


@receiver(post_save, sender=AcademicEvaluation)
def send_evaluation_notification(sender, instance, created, **kwargs):
    if created:
        

        # Email notification
        subject = 'Academic Evaluation Updated'
        message = f'Hello {student.first_name},\n\nYour academic evaluation has been updated.'

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[student.email],
            fail_silently=True,
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