from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from .models import CustomUser,PasswordResetOTP
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
            fail_silently=True,
        )
@receiver(post_save, sender=PasswordResetOTP)
def send_password_reset_confirmation(sender, instance, **kwargs):
    if instance.is_used:
        send_mail(
            subject='Password Reset Successful',
            message=f'Hello {instance.user.first_name} {instance.user.last_name},\n\nYour ILES account password has been reset successfully.\n\nIf this was not you, contact your administrator immediately.',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[instance.user.email],
            fail_silently=False,
        )

@receiver(post_save, sender=CustomUser)
def assign_user_to_group(sender, instance, created, **kwargs):
    if created:
        role_mapping = {
            'student': 'Student',
            'workplace_supervisor': 'Workplace Supervisor',
            'academic_supervisor': 'Academic Supervisor',
            'admin': 'Admin',
        }
        target_group_name = role_mapping.get(instance.role)

        if target_group_name:
            try:
                group = Group.objects.get(name=target_group_name)
                instance.groups.add(group)
            except Group.DoesNotExist:
                pass
        
