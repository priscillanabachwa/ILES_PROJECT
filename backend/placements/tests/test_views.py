
import pytest
from django.contrib.auth import get_user_model
from placements.models import InternshipPlacement, Company

User = get_user_model()

class TestPlacementViews:

    def test_student_can_submit_placement(self, student_client, db):
        url = "/api/placements/"
        test_company = Company.objects.create(company_name="Tech Corp")
        student_instance = User.objects.get(email="john@student.com")
        

        data = {
            "company": test_company.id,
            "student": student_instance.id,
            "start_date": "2025-01-01",
            "end_date": "2025-06-30",
        }
        response = student_client.post(url, data, format="json")
        assert response.status_code == 201

    def test_supervisor_can_approve_placement(self, supervisor_client, db):
        test_company = Company.objects.create(company_name="Tech Corp")
        student_instance = User.objects.get(email="john@student.com")
        supervisor_instance = User.objects.get(email="jane@company.com")
        

        placement = InternshipPlacement.objects.create(
            student=student_instance,
            company=test_company,
            workplace_supervisor=supervisor_instance,
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="PENDING"
        )
        url = f"/api/placements/{placement.id}/"
        response = supervisor_client.patch(url, {"status": "ACTIVE"}, format="json")
        assert response.status_code == 200
        placement.refresh_from_db()
        assert placement.status == "ACTIVE"

    def test_student_cannot_approve_placement(self, student_client, db):
        test_company = Company.objects.create(company_name="Tech Corp")
        student_instance = User.objects.get(email="john@student.com")
        
        placement = InternshipPlacement.objects.create(
            student=student_instance,
            company=test_company,
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="PENDING"
        )
        url = f"/api/placements/{placement.id}/"
        response = student_client.patch(url, {"status": "ACTIVE"}, format="json")
        

        assert response.status_code == 403