from django.shortcuts  import render
from rest_framework import permissions, viewsets
from .models import CustomUser
from .serializers import CustomUserSerializer




class CustomUserViewSet(viewsets.ModelViewSet):
    """API endpoint for managing custom users."""
    queryset = CustomUser.objects.all().order_by("email")
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]
