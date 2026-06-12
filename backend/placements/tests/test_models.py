# placements/tests/test_models.py
import pytest
from placements.models import InternshipPlacement

class TestInternshipPlacement:

    def test_placement_created_for_student(self, db, student_user, workplace_supervisor):
        placement = InternshipPlacement.objects.create(
            student=student_user,
            supervisor=workplace_supervisor,
            company_name="Tech Corp",
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="pending"
        )
        assert placement.student == student_user
        assert placement.company_name == "Tech Corp"
        assert placement.status == "pending"

    def test_placement_str_representation(self, db, student_user):
        placement = InternshipPlacement.objects.create(
            student=student_user,
            company_name="Tech Corp",
            start_date="2025-01-01",
            end_date="2025-06-30",
        )
        # adjust based on your __str__ method
        assert "Tech Corp" in str(placement)