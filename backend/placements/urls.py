from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlacementViewSet 

router = DefaultRouter()
router.register(r'list', PlacementViewSet, basename='placement')

urlpatterns = [
    path('api/', include(router.urls)),
]