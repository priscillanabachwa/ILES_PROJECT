from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import AcademicEvaluation


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
    from user_accounts.notifications import notify_user

    prev = getattr(instance, '_prev_status', None)
    curr = instance.status

    # Only notify when transitioning to SUBMITTED (not on every save)
    if curr != 'SUBMITTED' or prev == 'SUBMITTED':
        return

    student = instance.placement.student
    score   = f'{float(instance.total_score):.0f}%' if instance.total_score else 'N/A'
    grade   = instance.grade or 'N/A'

    title = 'Your Academic Evaluation Has Been Submitted'
    msg   = (f'Hello {student.first_name},\n\n'
             f'Your academic evaluation has been submitted by your supervisor.\n\n'
             f'Score: {score}  |  Grade: {grade}\n\n'
             f'Please log in to view your full evaluation results.')
    notify_user(student, title, msg, 'evaluation')
