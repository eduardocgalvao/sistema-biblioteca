from django.http import HttpResponse

# Create your views here.
def login_view(request):
    return HttpResponse("Página de login da biblioteca")