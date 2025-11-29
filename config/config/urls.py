from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from biblioteca.views import login_view, tela_inicial

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', login_view, name='login'),
    path('inicial/', tela_inicial, name='tela_inicial'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)