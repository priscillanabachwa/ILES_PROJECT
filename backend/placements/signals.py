from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import InternshipPlacement


@receiver(pre_save, sender=InternshipPlacement)
def capture_old_supervisors(sender, instance, **kwargs):
    """Snapshot the current supervisor values before saving so post_save can detect changes."""
    if instance.pk:
        try:
            old = InternshipPlacement.objects.get(pk=instance.pk)
            instance._old_workplace_supervisor = old.workplace_supervisor
            instance._old_academic_supervisor  = old.academic_supervisor
        except InternshipPlacement.DoesNotExist:
            instance._old_workplace_supervisor = None
            instance._old_academic_supervisor  = None
    else:
        instance._old_workplace_supervisor = None
        instance._old_academic_supervisor  = None


@receiver(post_save, sender=InternshipPlacement)
def notify_on_placement_change(sender, instance, created, **kwargs):
    from user_accounts.notifications import notify_user

    student       = instance.student
    workplace_sup = instance.workplace_supervisor
    academic_sup  = instance.academic_supervisor
    company_name  = instance.company.company_name if instance.company else 'your assigned company'
    student_name  = student.get_full_name() or student.email

    if created:
        # ── Notify student of new placement ──────────────────────────────
        title = 'Internship Placement Assigned'
        msg   = (f'Hello {student.first_name},\n\n'
                 f'You have been assigned an internship placement at {company_name}.\n\n'
                 f'Academic Supervisor: {academic_sup.get_full_name() if academic_sup else "Not yet assigned"}\n'
                 f'Workplace Supervisor: {workplace_sup.get_full_name() if workplace_sup else "Not yet assigned"}\n\n'
                 f'Please log in to view your placement details.')
        notify_user(student, title, msg, 'placement')

        # ── Notify supervisors assigned at creation time ──────────────────
        if workplace_sup:
            notify_user(
                workplace_sup,
                'New Intern Assigned to You',
                (f'Hello {workplace_sup.first_name},\n\n'
                 f'{student_name} has been assigned to you as an intern at {company_name}.\n\n'
                 f'Please log in to view their profile and weekly logbook.'),
                'placement',
            )

        if academic_sup:
            notify_user(
                academic_sup,
                'New Intern Assigned to You',
                (f'Hello {academic_sup.first_name},\n\n'
                 f'{student_name} has been assigned to you for academic supervision at {company_name}.\n\n'
                 f'Please log in to review their progress and evaluations.'),
                'placement',
            )

    else:
        # ── Detect newly assigned supervisors ────────────────────────────
        old_ws = getattr(instance, '_old_workplace_supervisor', None)
        old_as = getattr(instance, '_old_academic_supervisor',  None)

        wp_changed = workplace_sup and workplace_sup != old_ws
        as_changed = academic_sup  and academic_sup  != old_as

        # ── Notify student when supervisors change ────────────────────────
        if wp_changed or as_changed:
            sup_lines = []
            if academic_sup:
                sup_lines.append(f'Academic Supervisor: {academic_sup.get_full_name()}')
            if workplace_sup:
                sup_lines.append(f'Workplace Supervisor: {workplace_sup.get_full_name()}')
            notify_user(
                student,
                'Supervisors Assigned to Your Placement',
                (f'Hello {student.first_name},\n\n'
                 f'Supervisors have been assigned to your placement at {company_name}.\n\n'
                 + '\n'.join(sup_lines) +
                 f'\n\nPlease log in to view your updated placement details.'),
                'placement',
            )
        else:
            # Generic update (status change, dates, etc.)
            notify_user(
                student,
                'Your Internship Placement Has Been Updated',
                (f'Hello {student.first_name},\n\n'
                 f'Your internship placement at {company_name} has been updated.\n'
                 f'Current status: {instance.get_status_display()}\n\n'
                 f'Please log in to view the latest details.'),
                'placement',
            )

        # ── Notify newly assigned workplace supervisor ────────────────────
        if wp_changed:
            notify_user(
                workplace_sup,
                'New Intern Assigned to You',
                (f'Hello {workplace_sup.first_name},\n\n'
                 f'{student_name} has been assigned to you as an intern at {company_name}.\n\n'
                 f'Please log in to view their profile and weekly logbook.'),
                'placement',
            )

        # ── Notify newly assigned academic supervisor ─────────────────────
        if as_changed:
            notify_user(
                academic_sup,
                'New Intern Assigned to You',
                (f'Hello {academic_sup.first_name},\n\n'
                 f'{student_name} has been assigned to you for academic supervision at {company_name}.\n\n'
                 f'Please log in to review their progress and evaluations.'),
                'placement',
            )
