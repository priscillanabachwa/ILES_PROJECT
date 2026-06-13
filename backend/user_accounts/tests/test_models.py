import pytest
from django.contrib.auth import get_user_model

User = get_user_model()

def test_student_created_successfully(db):
    user = User.objects.create_user(
        email="student1@test.com",
        password="password123",
        role="STUDENT"
    )
    assert user.email == "student1@test.com"

def test_superuser_creation(db):
    admin = User.objects.create_superuser(
        email="admin@test.com",
        password="adminpassword123"
    )
    assert admin.email == "admin@test.com"
    assert admin.is_superuser is True