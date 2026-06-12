from rest_framework import viewsets
from .models import InternshipPlacement, Company
from .serializers import PlacementSerializer, CompanySerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import filters
from rest_framework.exceptions import PermissionDenied  

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all().order_by('company_name')
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]

class PlacementViewSet(viewsets.ModelViewSet):
    queryset = InternshipPlacement.objects.all()
    serializer_class = PlacementSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ['student__username', 'company__company_name']


    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.user.role == 'student' and request.method in ['PUT', 'PATCH']:
            raise PermissionDenied("Students are not authorized to modify placement tracking statuses.")

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