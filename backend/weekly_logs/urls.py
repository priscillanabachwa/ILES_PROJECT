from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WeeklyLogbookViewSet

router = DefaultRouter()
router.register(r'weekly-logs', WeeklyLogbookViewSet, basename='weeklylog')

urlpatterns = [
    path('', include(router.urls)),
]