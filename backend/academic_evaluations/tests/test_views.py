# academic_evaluations/tests/test_views.py
import pytest
from django.urls import reverse
from placements.models import InternshipPlacement, Company

class TestEvaluationViews:

    def test_academic_supervisor_can_submit_evaluation(
        self, academic_client, student_user
    ):
        url = reverse("evaluation-list")
        
        # 1. Create the prerequisite company and placement records
        company_instance = Company.objects.create(company_name="Tech Corp")
        placement = InternshipPlacement.objects.create(
            student=student_user,
            company=company_instance,
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="ACTIVE"
        )

        # 2. Build the payload (Double-check your academic_evaluations/models.py fields!)
        data = {
            "placement": placement.id,  # Highly likely your model requires a placement foreign key
            "student": student_user.id,
            "score": 85,                 # Verify if this field is named 'score', 'grade', or 'marks'
            "feedback": "Good performance overall", # Verify if this is 'feedback' or 'comments'
        }
        
        response = academic_client.post(url, data, format="json")
        assert response.status_code == 201

    def test_student_can_view_own_evaluation(self, student_client):
        url = reverse("evaluation-list")
        response = student_client.get(url)
        assert response.status_code == 200

    def test_student_cannot_submit_evaluation(self, student_client, student_user):
        url = reverse("evaluation-list")
        
        company_instance = Company.objects.create(company_name="Tech Corp")
        placement = InternshipPlacement.objects.create(
            student=student_user,
            company=company_instance,
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="ACTIVE"
        )

        data = {
            "placement": placement.id,
            "student": student_user.id,
            "score": 100,
            "feedback": "I graded myself",
        }
        
        response = student_client.post(url, data, format="json")
        # If the view has permission classes applied, this should return a 403 Forbidden.
        assert response.status_code == 403