from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import AcademicEvaluation

@receiver(pre_save, sender=AcademicEvaluation)
def capture_evaluation_status(sender, instance, **kwargs):
    """Track previous status to detect DRAFT → SUBMITTED transition."""
    if instance.pk:
        try:
            instance._prev_status = AcademicEvaluation.objects.get(pk=instance.pk).status
        except AcademicEvaluation.DoesNotExist:
            instance._prev_status = None
    else:
        instance._prev_status = None

@receiver(post_save, sender=AcademicEvaluation)
def send_evaluation_notification(sender, instance, created, **kwargs):
    from user_accounts.notifications import notify_user

    prev = getattr(instance, '_prev_status', None)
    curr = instance.status

    if curr != 'SUBMITTED' or prev == 'SUBMITTED':
        return

    student       = instance.placement.student
    evaluator     = instance.evaluator
    grade         = instance.grade or 'N/A'
    evaluator_role = getattr(evaluator, 'role', '')

    if evaluator_role == 'workplace_supervisor':
        supervisor_label = 'Workplace Supervisor'
        title = 'Your Workplace Evaluation Has Been Submitted'
    else:
        supervisor_label = 'Academic Supervisor'
        title = 'Your Academic Evaluation Has Been Submitted'

    # Build score string with criterion names
    criteria_scores = []
    scored_items = instance.items.select_related('criteria').all()
    for item in scored_items:
        criterion_name = item.criteria.name
        item_score = f'{float(item.score):.0f}%'
        criteria_scores.append(f'Score ({criterion_name}): {item_score}')
    
    criteria_text = '\n'.join(criteria_scores) if criteria_scores else 'N/A'
    
    # Only show overall score if all applicable criteria have been evaluated
    from .models import EvaluationCriteria
    applicable_criteria = EvaluationCriteria.objects.filter(
        evaluator_type=evaluator_role,
        evaluation_stage__in=['any', 'log' if instance.log else ('final' if not instance.visit_number else 'any')],
        is_active=True
    )
    
    show_overall_score = scored_items.count() == applicable_criteria.count() and applicable_criteria.count() > 0
    
    if show_overall_score:
        overall_score = f'{float(instance.total_score):.0f}%' if instance.total_score else 'N/A'
        msg = (f'Hello {student.first_name},\n\n'
               f'Your evaluation has been submitted by your {supervisor_label}.\n\n'
               f'{criteria_text}\n'
               f'Overall Score: {overall_score}  |  Grade: {grade}\n\n'
               f'Please log in to view your full evaluation results.')
    else:
        msg = (f'Hello {student.first_name},\n\n'
               f'Your evaluation has been submitted by your {supervisor_label}.\n\n'
               f'{criteria_text}\n'
               f'Grade: {grade}\n\n'
               f'Please log in to view your full evaluation results.')
    
    notify_user(student, title, msg, 'evaluation')
