
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name = 'index'),

    path('users/', views.user_list, name = 'user_list'),
    path('placements/', views.placement_list, name = 'placement_list'),
    path('logbooks/', views.logbook_list, name = 'logbook_list'),
    path('evaluations/', views.evaluation_list, name = 'evaluation_list'),
    path('scores/', views.score_list, name = 'score_list'),
]