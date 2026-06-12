# placements/tests/test_views.py
import pytest
from django.urls import reverse
from placements.models import InternshipPlacement, Company

class TestPlacementViews:

    def test_student_can_submit_placement(self, student_client, db):
        url = reverse("placement-list")
        test_company = Company.objects.create(company_name="Tech Corp")
        
        data = {
            "company": test_company.id,
            "start_date": "2025-01-01",
            "end_date": "2025-06-30",
        }
        response = student_client.post(url, data)
        assert response.status_code == 201

    def test_supervisor_can_approve_placement(self, supervisor_client, db, student_user):
        test_company = Company.objects.create(company_name="Tech Corp")
        
        placement = InternshipPlacement.objects.create(
            student=student_user,
            company=test_company,
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="PENDING"
        )
        url = reverse("placement-detail", args=[placement.id])
        # Use uppercase 'ACTIVE' or 'COMPLETED' depending on what your view considers "Approved"
        response = supervisor_client.patch(url, {"status": "ACTIVE"}, format="json")
        assert response.status_code == 200
        placement.refresh_from_db()
        assert placement.status == "ACTIVE"

    def test_student_cannot_approve_placement(self, student_client, db, student_user):
        test_company = Company.objects.create(company_name="Tech Corp")
        
        placement = InternshipPlacement.objects.create(
            student=student_user,
            company=test_company,
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="PENDING"
        )
        url = reverse("placement-detail", args=[placement.id])
        response = student_client.patch(url, {"status": "ACTIVE"}, format="json")
        assert response.status_code == 403