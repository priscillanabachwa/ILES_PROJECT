# backend/conftest.py
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()

# ── USER FIXTURES ──────────────────────────────────────────

@pytest.fixture
def student_user(db):
    return User.objects.create_user(
        username="student_john",
        email="john@student.com",
        password="testpass123",
        role="student"
    )

@pytest.fixture
def workplace_supervisor(db):
    return User.objects.create_user(
        username="supervisor_jane",
        email="jane@company.com",
        password="testpass123",
        role="workplace_supervisor"
    )

@pytest.fixture
def academic_supervisor(db):
    return User.objects.create_user(
        username="academic_bob",
        email="bob@university.com",
        password="testpass123",
        role="academic_supervisor"
    )

@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="admin",
        email="admin@iles.com",
        password="adminpass123"
    )

# ── API CLIENT FIXTURES ────────────────────────────────────

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def student_client(api_client, student_user):
    api_client.force_authenticate(user=student_user)
    return api_client

@pytest.fixture
def supervisor_client(api_client, workplace_supervisor):
    api_client.force_authenticate(user=workplace_supervisor)
    return api_client

@pytest.fixture
def academic_client(api_client, academic_supervisor):
    api_client.force_authenticate(user=academic_supervisor)
    return api_client

@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client