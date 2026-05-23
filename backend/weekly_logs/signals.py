from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import WeeklyLogbook


@receiver(pre_save, sender=WeeklyLogbook)
def capture_previous_status(sender, instance, **kwargs):
    """Store the old status before saving so post_save can detect transitions."""
    if instance.pk:
        try:
            instance._prev_status = WeeklyLogbook.objects.get(pk=instance.pk).status
        except WeeklyLogbook.DoesNotExist:
            instance._prev_status = None
    else:
        instance._prev_status = None

from django.contrib.auth.models import Group, Permission


@receiver(post_save, sender=WeeklyLogbook)
def notify_on_log_status_change(sender, instance, created, **kwargs):
    from user_accounts.notifications import notify_user

    placement     = instance.placement
    student       = placement.student
    workplace_sup = placement.workplace_supervisor
    academic_sup  = placement.academic_supervisor
    prev          = getattr(instance, '_prev_status', None)
    curr          = instance.status
    week          = instance.week_number
    student_name  = student.get_full_name() or student.email

    if created:
        return  # Draft created — no notification needed

    if prev == 'draft' and curr == 'submitted':
        title = f'New Log Submitted — Week {week}'
        msg   = (f'{student_name} has submitted their Week {week} logbook.\n\n'
                 f'Please log in to review it.')
        if workplace_sup:
            notify_user(workplace_sup, title, msg, 'log_submitted', send_email=True, send_sms_alert=True)
        if academic_sup:
            notify_user(academic_sup, title, msg, 'log_submitted', send_email=True, send_sms_alert=True)

    elif prev == 'submitted' and curr == 'reviewed':
        title = f'Your Week {week} Log Has Been Reviewed'
        msg   = (f'Hello {student.first_name},\n\n'
                 f'Your Week {week} logbook has been reviewed by your Academic Supervisor.\n\n'
                 f'Academic Supervisor comment: {instance.supervisor_comment}')
        notify_user(student, title, msg, 'log_reviewed', send_email=True, send_sms_alert=True)

    elif prev == 'reviewed' and curr == 'approved':
        title = f'Your Week {week} Log Has Been Approved'
        msg   = (f'Hello {student.first_name},\n\n'
                 f'Your Week {week} logbook has been approved by your Academic Supervisor. Well done!')
        notify_user(student, title, msg, 'log_approved', send_email=True, send_sms_alert=True)

    elif (prev == 'submitted' or prev == 'reviewed') and curr == 'draft':
        # Disapproved — returned to draft for revision
        title = f'Your Week {week} Log Requires Revision'
        msg   = (f'Hello {student.first_name},\n\n'
                 f'Your Week {week} logbook has been returned for revision by your Academic Supervisor.\n\n'
                 f'Academic Supervisor feedback: {instance.supervisor_comment}')
        notify_user(student, title, msg, 'log_rejected', send_email=True, send_sms_alert=True)
