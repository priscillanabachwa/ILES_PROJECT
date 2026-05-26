from django.core.mail import send_mail
from django.conf import settings
from twilio.rest import Client

def send_sms(phone_number, message):
    """Send an SMS notification via Twilio. Returns True if successful, False otherwise."""
    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
        print("⚠️  Twilio credentials not configured. SMS not sent.")
        return False
    
    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message_obj = client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        print(f"[OK] SMS sent to {phone_number}. SID: {message_obj.sid}")
        return True
    except Exception as e:
        print(f"[FAIL] Failed to send SMS to {phone_number}: {str(e)}")
        return False

def send_notification_email(subject, message, recipient_email):
    """Send an email notification. Fails silently so it never blocks the request."""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=True,
        )
        print(f"[OK] Email sent to {recipient_email}")
        return True
    except Exception as e:
        print(f"[FAIL] Failed to send email to {recipient_email}: {str(e)}")
        return False

def create_notification(user, title, message, notification_type='general'):
    """Persist an in-app notification for a user."""
    from .models import Notification
    Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
    )
    print(f"[OK] In-app notification created for {user.email}")

def notify_user(user, title, message, notification_type='general', send_sms_alert=False, send_email=True):
    """
    Send a comprehensive notification to the user.
    
    Args:
        user: The user to notify
        title: Notification title
        message: Notification message/body
        notification_type: Type of notification (for categorization)
        send_sms_alert: Whether to send SMS (only if phone_number exists)
        send_email: Whether to send email
    """
    create_notification(user, title, message, notification_type)
    
    if send_email and user.email:
        send_notification_email(title, message, user.email)
    
    if send_sms_alert and user.phone_number:
        sms_message = f"[ILES] {title}: {message[:100]}"
        send_sms(user.phone_number, sms_message)

def notify_log_submitted(user):
    """Notify user when a weekly log is submitted."""
    notify_user(
        user,
        title="Weekly Log Submitted",
        message="Your weekly log has been successfully submitted for review.",
        notification_type='log_submitted',
        send_email=True,
        send_sms_alert=True
    )

def notify_log_approved(user):
    """Notify user when a weekly log is approved."""
    notify_user(
        user,
        title="Weekly Log Approved",
        message="Your weekly log has been reviewed and approved!",
        notification_type='log_approved',
        send_email=True,
        send_sms_alert=True
    )

def notify_log_rejected(user, reason=""):
    """Notify user when a weekly log is rejected."""
    message = f"Your weekly log was rejected for review. Reason: {reason}" if reason else "Your weekly log requires revision. Please review the feedback and resubmit."
    notify_user(
        user,
        title="Weekly Log Requires Revision",
        message=message,
        notification_type='log_rejected',
        send_email=True,
        send_sms_alert=True
    )

def notify_evaluation_assigned(user):
    """Notify user when an evaluation is assigned."""
    notify_user(
        user,
        title="New Evaluation Assigned",
        message="You have a new evaluation to complete. Please log in to view the details.",
        notification_type='evaluation',
        send_email=True,
        send_sms_alert=False
    )

def notify_placement_updated(user, placement_info=""):
    """Notify user when their placement is updated."""
    message = f"Your placement has been updated: {placement_info}" if placement_info else "Your placement information has been updated."
    notify_user(
        user,
        title="Placement Updated",
        message=message,
        notification_type='placement',
        send_email=True,
        send_sms_alert=True
    )

def notify_welcome(user):
    """Send welcome notification to new users."""
    notify_user(
        user,
        title="Welcome to ILES",
        message=f"Welcome {user.first_name}! You have successfully registered. Complete your profile to get started.",
        notification_type='welcome',
        send_email=True,
        send_sms_alert=False
    )
