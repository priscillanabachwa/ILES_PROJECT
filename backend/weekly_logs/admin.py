from django.contrib import admin
from .models import WeeklyLogbook


@admin.register(WeeklyLogbook)
class WeeklyLogbookAdmin(admin.ModelAdmin):
    list_display = ['placement', 'week_number', 'status', 'deadline', 'submitted_at', 'created_at']
    list_filter = ['status', 'deadline']
    search_fields = ['placement__student__email', 'placement__organization_name', 'activities']
    readonly_fields = ['created_at', 'updated_at', 'submitted_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Placement Info', {
            'fields': ('placement', 'week_number', 'deadline')
        }),
        ('Log Content', {
            'fields': ('activities', 'challenges', 'lesson')
        }),
        ('Status & Review', {
            'fields': ('status', 'supervisor_comment', 'submitted_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        # Lock all fields once a log is approved
        if obj and obj.status == 'approved':
            return [f.name for f in self.model._meta.fields]
        return self.readonly_fields