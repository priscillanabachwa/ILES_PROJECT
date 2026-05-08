from django.shortcuts import render
from rest_framework import permissions, viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
import random
import string

from .models import CustomUser, Notification
from .serializers import CustomUserSerializer, LoginSerializer, NotificationSerializer


class CustomUserViewSet(viewsets.ModelViewSet):
    """API endpoint for managing custom users."""
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = CustomUser.objects.all().order_by('email')
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        return qs


class NotificationViewSet(viewsets.GenericViewSet):
    """List, mark-read, delete, and filter notifications for the logged-in user."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        qs = Notification.objects.filter(user=self.request.user).order_by('-created_at')

        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() == 'true')

        notif_type = self.request.query_params.get('type')
        if notif_type:
            qs = qs.filter(notification_type=notif_type)

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(message__icontains=search))

        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'results': serializer.data, 'unread_count': unread_count})

    def partial_update(self, request, pk=None, *args, **kwargs):
        """Set or toggle read status for a single notification."""
        try:
            notif = self.get_queryset().get(pk=pk)
        except Notification.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if 'is_read' in request.data:
            notif.is_read = bool(request.data['is_read'])
        else:
            notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response(self.get_serializer(notif).data)

    def destroy(self, request, pk=None, *args, **kwargs):
        """Delete a single notification."""
        try:
            notif = self.get_queryset().get(pk=pk)
        except Notification.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        notif.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """Mark every notification for this user as read."""
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})

    @action(detail=False, methods=['delete'], url_path='clear-all')
    def clear_all(self, request):
        """Delete all notifications for this user."""
        Notification.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
  
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Get or create authentication token for the user
        token, created = Token.objects.get_or_create(user=user)
        
        # Serialize user data
        user_serializer = CustomUserSerializer(user)
        
        return Response({
            'token': token.key,
            'user': user_serializer.data
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
   
    serializer = CustomUserSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Get or create authentication token for the new user
        token, created = Token.objects.get_or_create(user=user)
        
        # Serialize user data
        user_serializer = CustomUserSerializer(user)
        
        return Response({
            'token': token.key,
            'user': user_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== PASSWORD RECOVERY ENDPOINTS ====================

def generate_reset_code(length=6):
    """Generate a random 6-digit recovery code"""
    return ''.join(random.choices(string.digits, k=length))


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    import logging
    logger = logging.getLogger(__name__)

    email = request.data.get('email', '').strip().lower()

    if not email:
        return Response(
            {'detail': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        # Don't reveal whether the email exists
        return Response(
            {'detail': 'If an account with that email exists, a recovery code has been sent.'},
            status=status.HTTP_200_OK
        )

    recovery_code = generate_reset_code()
    cache_key = f'password_reset_{email}'
    cache.set(cache_key, recovery_code, timeout=900)

    # Always log the code so it's visible in Django console (helpful in development)
    logger.warning(f'[PASSWORD RESET] Code for {email}: {recovery_code}')
    print(f'[PASSWORD RESET] Code for {email}: {recovery_code}')

    name = user.first_name or 'User'
    email_body = (
        f'Hello {name},\n\n'
        f'You requested a password reset for your ILES account.\n\n'
        f'Your recovery code is:\n\n'
        f'    {recovery_code}\n\n'
        f'This code expires in 15 minutes.\n\n'
        f'If you did not request this, please ignore this email.\n\n'
        f'ILES - Internship Logging and Evaluation System'
    )

    try:
        send_mail(
            subject='ILES - Your Password Recovery Code',
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f'[PASSWORD RESET] Failed to send email to {email}: {e}')
        return Response(
            {'detail': 'Failed to send recovery email. Please try again later.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response(
        {'detail': 'A recovery code has been sent to your email address.'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_reset_code(request):
   
    email = request.data.get('email')
    code = request.data.get('code')

    if not email or not code:
        return Response(
            {'detail': 'Email and code are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    cache_key = f'password_reset_{email}'
    stored_code = cache.get(cache_key)

    if not stored_code:
        return Response(
            {'detail': 'Recovery code expired or not found. Request a new one.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if stored_code != code:
        return Response(
            {'detail': 'Invalid recovery code.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    verify_key = f'password_reset_verified_{email}'
    cache.set(verify_key, True, timeout=900)  # 15 minutes
    
    return Response(
        {'message': 'Code verified successfully'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    email = request.data.get('email')
    new_password = request.data.get('new_password')


    if not all([email, new_password]):
        return Response(
            {'detail': 'Missing required fields.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    verify_key = f'password_reset_verified_{email}'
    if not cache.get(verify_key):
        return Response(
            {'detail': 'Recovery code has not been verified.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    
    try:
        user = CustomUser.objects.get(email=email)
        user.set_password(new_password)
        user.save() 

        cache.delete(f'password_reset_{email}')
        cache.delete(verify_key)

        send_mail(
            subject='ILES - Password Reset Confirmation',
            message=f"""
Hello {user.first_name },

Your password has been reset successfully.

If you did not make this change, please contact support immediately.

Best regards,
ILES System
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )

        return Response(
            {'message': 'Password reset successfully'},
            status=status.HTTP_200_OK
        )
    except CustomUser.DoesNotExist:
        return Response(
            {'detail': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    


