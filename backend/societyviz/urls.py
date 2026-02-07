from django.urls import path, include

urlpatterns = [
    path("api/", include("graphapi.urls")),
]
