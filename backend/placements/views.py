
from django.shortcuts import render

from rest_framework import viewsets
from .models import InternshipPlacement
from .serializers import PlacementSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import filters

class PlacementViewSet(viewsets.ModelViewSet):
    queryset = InternshipPlacement.objects.all()
    serializer_class = PlacementSerializer

    permission_classes = [IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ['student__username', 'company_name']



