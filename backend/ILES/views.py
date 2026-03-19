from django.shortcuts import render
from django.http import HttpResponse
from .models import (
    CustomUser,
    InternshipPlacement,
    WeeklyLogbook,
    AcademicEvaluation,
    WeightedScoreComputation
)

# Create your views here.
def index(request):
    return HttpResponse("""
    <h1> ILES backend is online!</h1>
    <p> Your models are ready, and your URLs are connected.</p>
    <p> next stop: connecting the react frontend<p>
    """)

def user_list(request):
    users = CustomUser.objects.all()
    return HttpResponse(f"Found {users.count()} users in the system.")

def placement_list(request):
    placements = InternshipPlacement.objects.all()
    return HttpResponse("Placement list view -Work in Progress")

def logbook_list(request):
    logbooks = WeeklyLogbook.objects.all()
    return HttpResponse("Logbook list view -Work in Progress")

def evaluation_list(request):
    evaluations = AcademicEvaluation.objects.all()
    return HttpResponse("Evaluation list view -Work in Progress")

def score_list(request):
    scores = WeightedScoreComputation.objects.all()
    return HttpResponse("Weighted score list view -Work in Progress")