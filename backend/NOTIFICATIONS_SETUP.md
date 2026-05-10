# ILES Notifications Setup Guide

This guide explains how to configure Email and SMS notifications in the ILES system.

---

## 📧 Email Notifications Setup

### Development Mode (Console Output)
By default, emails are printed to the console for development. No setup needed.

### Production Mode (Gmail or Other SMTP)

Update `backend/ILES/settings.py`:

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'  # Use App Password, not your main password
DEFAULT_FROM_EMAIL = 'ILES System <your-email@gmail.com>'
```

#### Setting up Gmail App Password:
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not enabled
3. Go to App Passwords
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password
6. Use this password in `EMAIL_HOST_PASSWORD`

---

## 📱 SMS Notifications Setup (Twilio)

### Step 1: Create a Twilio Account
1. Go to [Twilio.com](https://www.twilio.com)
2. Sign up for a free trial account
3. You'll receive a free trial phone number (e.g., `+1234567890`)

### Step 2: Get Your Twilio Credentials
In your Twilio dashboard:
1. Find **Account SID** and **Auth Token**
2. Find or purchase a **Phone Number** for sending SMS

### Step 3: Configure Settings
Update `backend/ILES/settings.py`:

```python
TWILIO_ACCOUNT_SID = 'your-twilio-account-sid'
TWILIO_AUTH_TOKEN = 'your-twilio-auth-token'
TWILIO_PHONE_NUMBER = '+1234567890'  # Your Twilio phone number
```

### Step 4: Test SMS
Run in Django shell:
```python
python manage.py shell
```

Then:
```python
from user_accounts.notifications import send_sms
send_sms('+256700000000', 'Test SMS from ILES')
```

---

## 🔔 Using Notifications in Your Code

### Send All Notifications (In-App + Email + SMS)
```python
from user_accounts.notifications import notify_user

notify_user(
    user=user_object,
    title="Weekly Log Submitted",
    message="Your weekly log has been submitted successfully.",
    notification_type='log_submitted',
    send_email=True,
    send_sms_alert=True
)
```

### Send Only Email
```python
notify_user(
    user=user_object,
    title="Evaluation Assigned",
    message="You have a new evaluation to complete.",
    notification_type='evaluation',
    send_email=True,
    send_sms_alert=False
)
```

### Use Pre-Built Notification Functions
The system includes ready-made functions for common events:

```python
from user_accounts.notifications import (
    notify_log_submitted,
    notify_log_approved,
    notify_log_rejected,
    notify_evaluation_assigned,
    notify_placement_updated,
    notify_welcome
)

# Example: When a log is approved
notify_log_approved(user_object)

# Example: When a log is rejected
notify_log_rejected(user_object, reason="Please include more details")

# Example: When placement is updated
notify_placement_updated(user_object, placement_info="Updated to ABC Company")
```

---

## 📋 Notification Types

| Type | Usage | Auto SMS |
|------|-------|----------|
| `log_submitted` | When student submits weekly log | Yes |
| `log_reviewed` | When supervisor reviews log | No |
| `log_approved` | When log is approved | Yes |
| `log_rejected` | When log needs revision | Yes |
| `evaluation` | New evaluation assigned | No |
| `placement` | Placement info updated | Yes |
| `welcome` | Welcome to new users | No |
| `general` | General announcements | No |

---

## 🧪 Testing Without Real Credentials

### Email Testing
Emails are logged to console by default. Check your Django console output.

### SMS Testing
With Twilio free trial, you can only send SMS to verified numbers:
1. Add your phone number in Twilio dashboard
2. Verify it (Twilio will call/text you)
3. Only your verified number will receive SMS during trial

---

## 🚀 Deployment Notes

When deploying to production:

1. **Use Environment Variables** (recommended):
   ```python
   import os
   
   TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
   TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
   TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')
   
   EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
   EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
   ```

2. **Never commit credentials** to Git
3. **Use a .env file** locally (add to .gitignore)
4. **Set environment variables** on your hosting platform (Heroku, AWS, etc.)

---

## 🆘 Troubleshooting

### SMS not sending?
- Check Twilio credentials in settings
- Ensure phone number is verified (Twilio trial)
- Check Twilio dashboard for error logs
- Ensure user has a phone_number in their profile

### Email not sending?
- Check EMAIL_BACKEND setting
- For Gmail: Ensure App Password is used (not main password)
- Check console output in development mode
- Look for SMTP errors in Django logs

### Twilio Trial Limitations
- Can only send to verified phone numbers
- Limited free credits
- Need to upgrade for production

---

## 📞 Support
For issues:
- Twilio Support: [help.twilio.com](https://help.twilio.com)
- Gmail Support: [support.google.com](https://support.google.com)
- Django Email: [docs.djangoproject.com/email](https://docs.djangoproject.com/en/stable/topics/email/)
