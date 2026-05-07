from django.apps import AppConfig


class WeeklyLogsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'weekly_logs'
    
    def ready(self):
        import weekly_logs.signals  # Import signals to connect them
