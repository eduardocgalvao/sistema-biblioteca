from django.contrib import admin
from django.urls import path, include

from biblioteca.views import login_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('biblioteca/', login_view),
]
