# placements/tests/test_models.py
import pytest
from placements.models import InternshipPlacement, Company

class TestInternshipPlacement:

    def test_placement_created_for_student(self, db, student_user, workplace_supervisor):
        # Create company instance inside the test function
        test_company = Company.objects.create(company_name="Tech Corp")
        
        placement = InternshipPlacement.objects.create(
            student=student_user,
            workplace_supervisor=workplace_supervisor,
            company=test_company,  
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="PENDING"  # Must be uppercase to match your model choices
        )
        assert placement.student == student_user
        assert placement.company.company_name == "Tech Corp"
        assert placement.status == "PENDING"

    def test_placement_str_representation(self, db, student_user):
        test_company = Company.objects.create(company_name="Tech Corp")
        
        placement = InternshipPlacement.objects.create(
            student=student_user,
            company=test_company,
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="PENDING"
        )
        assert "Tech Corp" in str(placement)