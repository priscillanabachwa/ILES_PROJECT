from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WeeklyLogbookViewSet

router = DefaultRouter()
router.register(r'logbooks', WeeklyLogbookViewSet, basename='logbook')

urlpatterns = [
    path('', include(router.urls)),
]