from django.urls import include, path
from rest_framework import routers
from .views import (
    login_view,
    register_view,
    password_reset_request,
    verify_reset_code,
    password_reset_confirm,
    CustomUserViewSet,
    NotificationViewSet,
)

router = routers.DefaultRouter()
router.register(r'users',         CustomUserViewSet,    basename='customuser')
router.register(r'notifications', NotificationViewSet,  basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path('password-reset-request/', password_reset_request, name='password-reset-request'),
    path('verify-reset-code/', verify_reset_code, name='verify-reset-code'),
    path('password-reset-confirm/', password_reset_confirm, name='password-reset-confirm'),
]

