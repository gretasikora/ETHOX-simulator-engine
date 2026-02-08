from django.urls import path
from . import views

urlpatterns = [
    path("graph/", views.GraphView.as_view()),
    path("nodes/<str:agent_id>/", views.NodeDetailView.as_view()),
    path("graph/upload/", views.GraphUploadView.as_view()),
    path("simulations/run/", views.RunSimulationView.as_view()),
    path("simulations/report/", views.SimulationReportView.as_view()),
]
