
import pytest
from placements.models import InternshipPlacement

class TestInternshipPlacement:

    def test_placement_created_for_student(self, db, student_user, workplace_supervisor):
        placement = InternshipPlacement.objects.create(
            student=student_user,
           
            workplace_supervisor=workplace_supervisor,
            company="Tech Corp", 
            start_date="2025-01-01",
            end_date="2025-06-30",
            status="pending"
        )
        assert placement.student == student_user
        assert placement.company == "Tech Corp"  
        assert placement.status == "pending"

    def test_placement_str_representation(self, db, student_user):
        placement = InternshipPlacement.objects.create(
            student=student_user,
            
            company="Tech Corp",
            start_date="2025-01-01",
            end_date="2025-06-30",
        )
        
       
        assert "Tech Corp" in str(placement)