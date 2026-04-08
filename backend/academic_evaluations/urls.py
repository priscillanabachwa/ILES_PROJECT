from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AcademicEvaluationViewSet # Import your specific view

router = DefaultRouter()
router.register(r'scores', AcademicEvaluationViewSet, basename='evaluation')

urlpatterns = [
    path('', include(router.urls)),
]