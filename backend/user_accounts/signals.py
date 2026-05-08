from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from .models import CustomUser


@receiver(post_save, sender=CustomUser)
def send_welcome_notification(sender, instance, created, **kwargs):
    """Send welcome email + in-app notification when a new user registers."""
    if created:
        from .notifications import notify_user
        notify_user(
            instance,
            title='Welcome to ILES!',
            message=(
                f'Hello {instance.first_name},\n\n'
                f'Your account for the Internship Logging and Evaluation System (ILES) '
                f'has been created successfully.\n\n'
                f'Complete your profile to get started.\n\n'
                f'Best regards,\nThe ILES Team'
            ),
            notification_type='welcome',
            send_email=True,
            send_sms_alert=False,
        )


@receiver(post_save, sender=CustomUser)
def assign_user_to_group(sender, instance, created, **kwargs):
    if created:
        role_mapping = {
            'student':              'Student',
            'workplace_supervisor': 'Workplace Supervisor',
            'academic_supervisor':  'Academic Supervisor',
            'admin':                'Admin',
        }
        target_group_name = role_mapping.get(instance.role)
        if target_group_name:
            try:
                group = Group.objects.get(name=target_group_name)
                instance.groups.add(group)
            except Group.DoesNotExist:
                pass
