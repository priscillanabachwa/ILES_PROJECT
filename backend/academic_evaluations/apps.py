from django.apps import AppConfig

class AcademicEvaluationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'academic_evaluations'

    def ready(self):
        import academic_evaluations.signals
