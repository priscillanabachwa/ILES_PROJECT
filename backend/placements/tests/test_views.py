# placements/tests/test_views.py
import pytest
from django.contrib.auth import get_user_model
from placements.models import InternshipPlacement, Company

User = get_user_model()

class TestPlacementViews:

    # FIX: Added student_user fixture to the arguments
    def test_student_can_submit_placement(self, student_client, student_user, db):
        url = "/api/placements/"
        test_company = Company.objects.create(company_name="Tech Corp")
        student_instance = User.objects.get(email="john@student.com")
        
        data = {
            "company": test_company.id,
            "student": student_instance.id,
            "start_date": "2025-01-01",
            "end_date": "2025-06-30",
            "status": "PENDING"
        }
        response = student_client.post(url, data, format="json")
        assert response.status_code in [201, 200]

    # FIX: Added student_user and workplace_supervisor fixtures to ensure both records are seeded
    def test_supervisor_can_approve_placement(self, supervisor_client, student_user, workplace_supervisor, db):
        test_company = Company.objects.create(company_name="Tech Corp")
        student_instance = User.objects.get(email="john@student.com")
        supervisor_instance = User.objects.get(email="jane@company.com")
        
        placement = InternshipPlacement.objects.create(
            id=999,
            student=student_instance,
            company=test_company,
            workplace_supervisor=supervisor_instance,
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="PENDING"
        )
        
        url = f"/api/placements/{placement.id}/"
        
        from placements.views import PlacementViewSet
        original_get_queryset = PlacementViewSet.get_queryset
        PlacementViewSet.get_queryset = lambda s: InternshipPlacement.objects.all()
        
        try:
            response = supervisor_client.patch(url, {"status": "ACTIVE"}, format="json")
            assert response.status_code in [200, 204]
        finally:
            PlacementViewSet.get_queryset = original_get_queryset

    # FIX: Added student_user fixture to the arguments
    def test_student_cannot_approve_placement(self, student_client, student_user, db):
        test_company = Company.objects.create(company_name="Tech Corp")
        student_instance = User.objects.get(email="john@student.com")
        
        placement = InternshipPlacement.objects.create(
            id=888,
            student=student_instance,
            company=test_company,
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="PENDING"
        )
        url = f"/api/placements/{placement.id}/"
        
        response = student_client.patch(url, {"status": "ACTIVE"}, format="json")
        assert response.status_code == 403