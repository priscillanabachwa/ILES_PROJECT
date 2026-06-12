# placements/tests/test_views.py
import pytest
from django.urls import reverse

class TestPlacementViews:

    def test_student_can_submit_placement(self, student_client):
        url = reverse("placement-list")   # adjust to your URL name
        data = {
            "company_name": "Tech Corp",
            "start_date": "2025-01-01",
            "end_date": "2025-06-30",
        }
        response = student_client.post(url, data)
        assert response.status_code == 201

    def test_supervisor_can_approve_placement(self, supervisor_client, db, student_user):
        # first create a placement
        from placements.models import InternshipPlacement
        placement = InternshipPlacement.objects.create(
            student=student_user,
            company_name="Tech Corp",
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="pending"
        )
        url = reverse("placement-detail", args=[placement.id])
        response = supervisor_client.patch(url, {"status": "approved"})
        assert response.status_code == 200
        placement.refresh_from_db()
        assert placement.status == "approved"

    def test_student_cannot_approve_placement(self, student_client, db, student_user):
        from placements.models import InternshipPlacement
        placement = InternshipPlacement.objects.create(
            student=student_user,
            company_name="Tech Corp",
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="pending"
        )
        url = reverse("placement-detail", args=[placement.id])
        response = student_client.patch(url, {"status": "approved"})
        # student should not be allowed to approve
        assert response.status_code == 403