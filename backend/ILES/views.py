from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def index(request):
    return HttpResponse("""
    <h1> ILES backend is online!</h1>
    <p> Your models are ready, and your URLs are connected.</p>
    <p> next stop: connecting the react frontend<p>
    """)