from django.shortcuts import render
from rest_framework import permissions, viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import CustomUser
from .serializers import CustomUserSerializer, LoginSerializer


class CustomUserViewSet(viewsets.ModelViewSet):
    """API endpoint for managing custom users."""
    queryset = CustomUser.objects.all().order_by("email")
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    Login endpoint for user authentication.
    
    Expected POST data:
    {
        "email": "user@example.com",
        "password": "password123"
    }
    
    Returns:
    {
        "token": "auth_token_string",
        "user": {
            "id": 1,
            "email": "user@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "role": "student",
            "phone_number": "1234567890",
            "profile_picture": null
        }
    }
    """
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
    """
    Registration endpoint for creating new user accounts.
    
    Expected POST data:
    {
        "email": "user@example.com",
        "password": "password123",
        "first_name": "John",
        "last_name": "Doe",
        "role": "student",
        "phone_number": "1234567890"
    }
    
    Returns:
    {
        "token": "auth_token_string",
        "user": {
            "id": 1,
            "email": "user@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "role": "student",
            "phone_number": "1234567890",
            "profile_picture": null
        }
    }
    """
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


