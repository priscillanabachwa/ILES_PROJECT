from django.urls import include, path
from rest_framework import routers
from .views import login_view, register_view
from .views import CustomUserViewSet

router = routers.DefaultRouter()
router.register(r'users', CustomUserViewSet, basename='customuser')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', login_view, name='login'),  # POST endpoint for user login
    path('register/', register_view, name='register'),  # POST endpoint for user registration
]

