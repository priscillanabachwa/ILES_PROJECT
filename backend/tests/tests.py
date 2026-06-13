from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import date, timedelta

from users.models import CustomUser, Notification
from placements.models import Company, InternshipPlacement
from logbook.models import WeeklyLogbook, LogBookReview


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def make_student(email='student@test.com'):
    return CustomUser.objects.create_user(
        email=email,
        password='testpass123',
        first_name='Alice',
        last_name='Smith',
        role='student',
    )

def make_workplace_supervisor(email='wpsupervisor@test.com'):
    return CustomUser.objects.create_user(
        email=email,
        password='testpass123',
        first_name='Bob',
        last_name='Jones',
        role='workplace_supervisor',
    )

def make_academic_supervisor(email='acsupervisor@test.com'):
    return CustomUser.objects.create_user(
        email=email,
        password='testpass123',
        first_name='Carol',
        last_name='Brown',
        role='academic_supervisor',
    )

def make_company(name='Test Company Ltd'):
    return Company.objects.create(
        company_name=name,
        company_address='123 Test Street, Kampala',
    )

def make_placement(student, company, wp_supervisor=None, ac_supervisor=None,
                   start=None, end=None, status='ACTIVE'):
    start = start or date.today()
    end = end or date.today() + timedelta(days=90)
    return InternshipPlacement.objects.create(
        student=student,
        company=company,
        workplace_supervisor=wp_supervisor,
        academic_supervisor=ac_supervisor,
        start_date=start,
        end_date=end,
        status=status,
    )

def make_logbook(placement, week=1, status='draft'):
    return WeeklyLogbook.objects.create(
        placement=placement,
        week_number=week,
        activities='Attended orientation and team meetings.',
        challenges='Getting used to the workflow.',
        lesson='Learned how to use version control in a team setting.',
        status=status,
        deadline=date.today() + timedelta(days=7),
    )


# ─────────────────────────────────────────────
# 1. USER MODEL TESTS
# ─────────────────────────────────────────────

class CustomUserModelTest(TestCase):

    def test_create_student_user(self):
        """A student user is created with correct role and email."""
        user = make_student()
        self.assertEqual(user.email, 'student@test.com')
        self.assertEqual(user.role, 'student')
        self.assertTrue(user.check_password('testpass123'))

    def test_create_workplace_supervisor(self):
        """Workplace supervisor is created with correct role."""
        user = make_workplace_supervisor()
        self.assertEqual(user.role, 'workplace_supervisor')

    def test_create_academic_supervisor(self):
        """Academic supervisor is created with correct role."""
        user = make_academic_supervisor()
        self.assertEqual(user.role, 'academic_supervisor')

    def test_email_is_unique(self):
        """Two users cannot share the same email address."""
        make_student(email='unique@test.com')
        with self.assertRaises(Exception):
            make_student(email='unique@test.com')

    def test_user_str(self):
        """User __str__ returns email and role display."""
        user = make_student()
        self.assertIn('student@test.com', str(user))

    def test_default_role_is_student(self):
        """User created without explicit role defaults to student."""
        user = CustomUser.objects.create_user(
            email='norolegiven@test.com',
            password='pass123',
            first_name='Dan',
            last_name='Doe',
        )
        self.assertEqual(user.role, 'student')

    def test_create_superuser(self):
        """Superuser has is_staff and is_superuser True, role admin."""
        admin = CustomUser.objects.create_superuser(
            email='admin@test.com',
            password='adminpass',
            first_name='Admin',
            last_name='User',
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertEqual(admin.role, 'admin')


# ─────────────────────────────────────────────
# 2. COMPANY & PLACEMENT MODEL TESTS
# ─────────────────────────────────────────────

class CompanyModelTest(TestCase):

    def test_create_company(self):
        """Company is created and __str__ returns company name."""
        company = make_company()
        self.assertEqual(str(company), 'Test Company Ltd')

    def test_company_address_optional(self):
        """Company can be created without an address."""
        company = Company.objects.create(company_name='No Address Co')
        self.assertIsNone(company.company_address)


class InternshipPlacementModelTest(TestCase):

    def setUp(self):
        self.student = make_student()
        self.company = make_company()
        self.wp_sup = make_workplace_supervisor()
        self.ac_sup = make_academic_supervisor()

    def test_create_placement(self):
        """A placement is created with correct student and company."""
        placement = make_placement(self.student, self.company)
        self.assertEqual(placement.student, self.student)
        self.assertEqual(placement.company, self.company)
        self.assertEqual(placement.status, 'ACTIVE')

    def test_placement_str(self):
        """Placement __str__ contains student email and company name."""
        placement = make_placement(self.student, self.company)
        self.assertIn('Test Company Ltd', str(placement))

    def test_end_date_must_be_after_start_date(self):
        """Saving a placement where end_date <= start_date raises ValidationError."""
        with self.assertRaises(ValidationError):
            InternshipPlacement.objects.create(
                student=self.student,
                company=self.company,
                start_date=date.today(),
                end_date=date.today(),  # same day — invalid
                status='PENDING',
            )

    def test_default_status_is_pending(self):
        """A new placement defaults to PENDING status."""
        placement = InternshipPlacement.objects.create(
            student=self.student,
            company=self.company,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        self.assertEqual(placement.status, 'PENDING')

    def test_supervisors_are_optional(self):
        """A placement can be saved without supervisors assigned."""
        placement = make_placement(self.student, self.company)
        self.assertIsNone(placement.workplace_supervisor)
        self.assertIsNone(placement.academic_supervisor)

    def test_with_supervisors_assigned(self):
        """A placement saves correctly with both supervisors set."""
        placement = make_placement(
            self.student, self.company,
            wp_supervisor=self.wp_sup,
            ac_supervisor=self.ac_sup,
        )
        self.assertEqual(placement.workplace_supervisor, self.wp_sup)
        self.assertEqual(placement.academic_supervisor, self.ac_sup)


# ─────────────────────────────────────────────
# 3. WEEKLY LOGBOOK MODEL TESTS
# ─────────────────────────────────────────────

class WeeklyLogbookModelTest(TestCase):

    def setUp(self):
        self.student = make_student()
        self.company = make_company()
        self.placement = make_placement(self.student, self.company)

    def test_create_logbook_entry(self):
        """A weekly log is created with correct placement and week number."""
        log = make_logbook(self.placement, week=1)
        self.assertEqual(log.placement, self.placement)
        self.assertEqual(log.week_number, 1)
        self.assertEqual(log.status, 'draft')

    def test_logbook_str(self):
        """WeeklyLogbook __str__ includes week number."""
        log = make_logbook(self.placement, week=3)
        self.assertIn('week3', str(log))

    def test_default_status_is_draft(self):
        """A new logbook entry defaults to draft status."""
        log = make_logbook(self.placement)
        self.assertEqual(log.status, 'draft')

    def test_duplicate_week_for_same_placement_is_rejected(self):
        """Two logs for the same placement and week number raises an error."""
        make_logbook(self.placement, week=1)
        with self.assertRaises(Exception):
            make_logbook(self.placement, week=1)

    def test_same_week_different_placements_is_allowed(self):
        """Week 1 logs for two different placements should both save fine."""
        student2 = make_student(email='student2@test.com')
        placement2 = make_placement(student2, self.company)
        log1 = make_logbook(self.placement, week=1)
        log2 = make_logbook(placement2, week=1)
        self.assertNotEqual(log1.pk, log2.pk)

    def test_status_transitions(self):
        """Log status can be updated through the workflow stages."""
        log = make_logbook(self.placement)
        log.status = 'submitted'
        log.save()
        log.refresh_from_db()
        self.assertEqual(log.status, 'submitted')

        log.status = 'reviewed'
        log.save()
        log.refresh_from_db()
        self.assertEqual(log.status, 'reviewed')

        log.status = 'approved'
        log.save()
        log.refresh_from_db()
        self.assertEqual(log.status, 'approved')

    def test_challenges_and_lesson_are_optional(self):
        """A log can be saved with empty challenges and lesson fields."""
        log = WeeklyLogbook.objects.create(
            placement=self.placement,
            week_number=5,
            activities='Worked on API integration.',
            deadline=date.today() + timedelta(days=7),
        )
        self.assertEqual(log.challenges, '')
        self.assertEqual(log.lesson, '')

    def test_supervisor_comment_is_optional(self):
        """Supervisor comment is null by default."""
        log = make_logbook(self.placement)
        self.assertIsNone(log.supervisor_comment)

    def test_ordering_is_by_week_number_descending(self):
        """Logs are returned newest week first."""
        make_logbook(self.placement, week=1)
        make_logbook(self.placement, week=2)
        make_logbook(self.placement, week=3)
        logs = WeeklyLogbook.objects.filter(placement=self.placement)
        self.assertEqual(logs[0].week_number, 3)


# ─────────────────────────────────────────────
# 4. LOGBOOK REVIEW MODEL TESTS
# ─────────────────────────────────────────────

class LogBookReviewModelTest(TestCase):

    def setUp(self):
        self.student = make_student()
        self.company = make_company()
        self.placement = make_placement(self.student, self.company)
        self.log = make_logbook(self.placement, week=1, status='submitted')
        self.supervisor = make_workplace_supervisor()

    def test_create_review(self):
        """A review is created and linked to the correct logbook and supervisor."""
        review = LogBookReview.objects.create(
            logbook=self.log,
            supervisor=self.supervisor,
            comment='Good progress this week.',
            status_at_review='submitted',
        )
        self.assertEqual(review.logbook, self.log)
        self.assertEqual(review.supervisor, self.supervisor)
        self.assertEqual(review.comment, 'Good progress this week.')

    def test_review_str(self):
        """LogBookReview __str__ contains supervisor info."""
        review = LogBookReview.objects.create(
            logbook=self.log,
            supervisor=self.supervisor,
            comment='Needs improvement.',
            status_at_review='submitted',
        )
        self.assertIn(self.supervisor.email, str(review))

    def test_multiple_reviews_on_same_log(self):
        """A logbook entry can have multiple reviews."""
        LogBookReview.objects.create(
            logbook=self.log,
            supervisor=self.supervisor,
            comment='First review.',
            status_at_review='submitted',
        )
        LogBookReview.objects.create(
            logbook=self.log,
            supervisor=self.supervisor,
            comment='Follow-up review.',
            status_at_review='reviewed',
        )
        self.assertEqual(self.log.reviews.count(), 2)

    def test_review_supervisor_set_null_on_user_delete(self):
        """Deleting a supervisor sets review supervisor to null, not cascade."""
        review = LogBookReview.objects.create(
            logbook=self.log,
            supervisor=self.supervisor,
            comment='Will be orphaned.',
            status_at_review='submitted',
        )
        self.supervisor.delete()
        review.refresh_from_db()
        self.assertIsNone(review.supervisor)


# ─────────────────────────────────────────────
# 5. NOTIFICATION MODEL TESTS
# ─────────────────────────────────────────────

class NotificationModelTest(TestCase):

    def setUp(self):
        self.user = make_student()

    def test_create_notification(self):
        """A notification is created and linked to the correct user."""
        notif = Notification.objects.create(
            user=self.user,
            title='Log Submitted',
            message='Your week 1 log has been submitted.',
            notification_type='log_submitted',
        )
        self.assertEqual(notif.user, self.user)
        self.assertFalse(notif.is_read)

    def test_notification_default_is_unread(self):
        """Notifications are unread by default."""
        notif = Notification.objects.create(
            user=self.user,
            title='Welcome',
            message='Welcome to ILES.',
            notification_type='welcome',
        )
        self.assertFalse(notif.is_read)

    def test_mark_notification_as_read(self):
        """A notification can be marked as read."""
        notif = Notification.objects.create(
            user=self.user,
            title='Log Approved',
            message='Your log has been approved.',
            notification_type='log_approved',
        )
        notif.is_read = True
        notif.save()
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_notification_str(self):
        """Notification __str__ contains user email and title."""
        notif = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            message='Just a test.',
        )
        self.assertIn(self.user.email, str(notif))
        self.assertIn('Test Notification', str(notif))