from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.authtoken.models import Token
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny 
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings


from .models import CustomUser
from .serializers import (CustomUserSerializer, 
                          LoginSerializer,
                          PasswordResetRequestSerializer,
                          PasswordResetVerifyOTPSerializer,
                          PasswordResetConfirmSerializer)


class CustomUserViewSet(viewsets.ModelViewSet):
    """API endpoint for managing custom users."""
    queryset = CustomUser.objects.all().order_by("email")
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

User = get_user_model()
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')

    if not email or not password:
        return Response(
            {'detail': 'Email and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response(
            {'detail': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # ✅ This correctly checks Django-hashed passwords
    if not user.check_password(password):
        return Response(
            {'detail': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {'detail': 'Account is disabled.'},
            status=status.HTTP_403_FORBIDDEN
        )

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            # ✅ Make sure this field exists on your User model
            # Common values: 'student', 'admin', 'academic_supervisor', 'workplace_supervisor'
            'role': user.role,
        }
    })



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


# ==================== PASSWORD RECOVERY ENDPOINTS =====================


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    email = request.data.get('email')
    
    
    
    if not email:
        return Response(
            {'detail': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = CustomUser.objects.get(email=email)
        recovery_code = generate_reset_code()
        cache_key = f'password_reset_{email}'
        cache.set(cache_key, recovery_code, timeout=900)  # 15 minutes

        send_mail(
            subject='Your recovery code for ILES',
            message=f'Hello {user.first_name},\n\nYour recovery code is: {recovery_code}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

    except CustomUser.DoesNotExist:
        # For security, don't reveal if email exists
        pass

    return Response(
        {'detail': 'If an account with that email exists, a recovery code has been generated'},
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
        # Store password as plain text (no hashing)
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
    


