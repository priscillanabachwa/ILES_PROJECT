def test_student_created_successfully(db):
    user = User.objects.create_user(
        email="student1@test.com",
        password="password123",
        role="STUDENT"
    )
    # FIX: Check email instead of username
    assert user.email == "student1@test.com"

def test_superuser_creation(db):
    # FIX: Pass email instead of username
    admin = User.objects.create_superuser(
        email="admin@test.com",
        password="adminpassword123"
    )
    assert admin.email == "admin@test.com"
    assert admin.is_superuser is True