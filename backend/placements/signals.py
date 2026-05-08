from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import InternshipPlacement


@receiver(post_save, sender=InternshipPlacement)
def notify_on_placement_change(sender, instance, created, **kwargs):
    from user_accounts.notifications import notify_user

    student       = instance.student
    workplace_sup = instance.workplace_supervisor
    academic_sup  = instance.academic_supervisor
    company_name  = instance.company.company_name if instance.company else 'your assigned company'

    if created:
        title = 'Internship Placement Assigned'
        msg   = (f'Hello {student.first_name},\n\n'
                 f'You have been assigned an internship placement at {company_name}.\n\n'
                 f'Academic Supervisor: {academic_sup.get_full_name() if academic_sup else "Not yet assigned"}\n'
                 f'Workplace Supervisor: {workplace_sup.get_full_name() if workplace_sup else "Not yet assigned"}\n\n'
                 f'Please log in to view your placement details.')
        notify_user(student, title, msg, 'placement')

        # Also notify supervisors when they are assigned
        if workplace_sup:
            ws_title = 'New Intern Assigned to You'
            ws_msg   = (f'Hello {workplace_sup.first_name},\n\n'
                        f'{student.get_full_name() or student.email} has been assigned to you '
                        f'as an intern at {company_name}.\n\nPlease log in to view their profile.')
            notify_user(workplace_sup, ws_title, ws_msg, 'placement')

        if academic_sup:
            as_title = 'New Intern Assigned to You'
            as_msg   = (f'Hello {academic_sup.first_name},\n\n'
                        f'{student.get_full_name() or student.email} has been assigned to you '
                        f'for academic supervision at {company_name}.\n\nPlease log in to view their profile.')
            notify_user(academic_sup, as_title, as_msg, 'placement')

    else:
        # Placement updated (e.g. status changed, supervisor reassigned)
        title = 'Your Internship Placement Has Been Updated'
        msg   = (f'Hello {student.first_name},\n\n'
                 f'Your internship placement at {company_name} has been updated.\n'
                 f'Current status: {instance.get_status_display()}\n\n'
                 f'Please log in to view the latest details.')
        notify_user(student, title, msg, 'placement')
