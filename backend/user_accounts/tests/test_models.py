# user_accounts/tests/test_models.py
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()

class TestUserModel:

    def test_student_created_successfully(self, db):
        user = User.objects.create_user(
           
            email="student1@test.com",
            password="pass123",
            role="student"
        )
        assert user.username == "student1"
        assert user.email == "student1@test.com"
        assert user.role == "student"

    def test_password_is_hashed(self, db):
        user = User.objects.create_user(email="testuser@example.com", password="password123")
        # password should never be stored as plain text
        assert user.password != "plainpassword"

    def test_superuser_creation(self, db):
        admin = User.objects.create_superuser(
            username="admin",
            password="adminpass"
        )
        assert admin.is_staff is True
        assert admin.is_superuser is True