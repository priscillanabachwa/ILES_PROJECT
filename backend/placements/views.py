
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
    search_fields = ['student__username', 'company__company_name']

    def perform_create(self, serializer):
        if self.request.user.role == 'student':
            serializer.save(student=self.request.user)
        else:
            serializer.save()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return InternshipPlacement.objects.filter(student=user)
        elif user.role == 'workplace_supervisor':
            return InternshipPlacement.objects.filter(workplace_supervisor=user)
        elif user.role == 'academic_supervisor':
            return InternshipPlacement.objects.filter(academic_supervisor=user)
        return super().get_queryset()
          

