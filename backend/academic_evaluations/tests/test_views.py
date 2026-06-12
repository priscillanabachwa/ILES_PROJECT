
# academic_evaluations/tests/test_views.py
import pytest
from django.urls import reverse

class TestEvaluationViews:

    def test_academic_supervisor_can_submit_evaluation(
        self, academic_client, student_user
    ):
        url = reverse("evaluation-list")   # adjust to your URL name
        data = {
            "student": student_user.id,
            "score": 85,
            "feedback": "Good performance overall",
        }
        response = academic_client.post(url, data)
        assert response.status_code == 201

    def test_student_can_view_own_evaluation(self, student_client):
        url = reverse("evaluation-list")
        response = student_client.get(url)
        assert response.status_code == 200

    def test_student_cannot_submit_evaluation(self, student_client, student_user):
        url = reverse("evaluation-list")
        data = {
            "student": student_user.id,
            "score": 100,
            "feedback": "I graded myself",
        }
        response = student_client.post(url, data)
        # students should not be allowed to submit evaluations
        assert response.status_code == 403