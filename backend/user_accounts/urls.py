from django.urls import include, path
from rest_framework import routers
from .views import (
    login_view, 
    register_view, 
    password_reset_request,
    verify_reset_code,
    password_reset_confirm
)
from .views import CustomUserViewSet

router = routers.DefaultRouter()
router.register(r'users', CustomUserViewSet, basename='customuser')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', login_view, name='login'),  # POST endpoint for user login
    path('register/', register_view, name='register'),  # POST endpoint for user registration
    path('password-reset-request/', password_reset_request, name='password-reset-request'),  # POST endpoint for requesting password reset
    path('verify-reset-code/', verify_reset_code, name='verify-reset-code'),  # POST endpoint for verifying reset code
    path('password-reset-confirm/', password_reset_confirm, name='password-reset-confirm'),  # POST endpoint for confirming password reset
]

