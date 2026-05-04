from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AcademicEvaluationViewSet, EvaluationCriteriaViewSet, EvaluationScoreViewSet

router = DefaultRouter()
router.register(r'evaluations', AcademicEvaluationViewSet, basename='evaluation')
router.register(r'criteria', EvaluationCriteriaViewSet, basename='criteria')
router.register(r'scores', EvaluationScoreViewSet, basename='scores')

urlpatterns = [
    path('api/', include(router.urls)),
]