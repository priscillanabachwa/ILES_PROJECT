from django.shortcuts import render
from rest_framework import viewsets
from .models import WeeklyLogbook
from .serializers import WeeklyLogbookSerializer

class WeeklyLogbookViewSet(viewsets.ModelViewSet):
    queryset = WeeklyLogbook.objects.all()
    serializer_class = WeeklyLogbookSerializer
