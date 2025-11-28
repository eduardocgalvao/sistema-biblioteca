from django.shortcuts import render
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import authenticate
from .models import tbl_usuario

# Create your views here.
def login_view(request):
    login_form = AuthenticationForm()
    
    if request.method == 'POST':
        email = request.POST.get("email")
        
        # Autentica usando o backend customizado
        usuario = authenticate(request, email=email)
        
        if usuario is not None:
            # Armazenar usuário na sessão sem usar login() 
            request.session['usuario_id'] = usuario.id_usuario
            request.session['usuario_nome'] = usuario.nome
            request.session['usuario_email'] = usuario.email
            print("Login realizado com sucesso!")
        else:
            print("Usuário não encontrado ou credenciais inválidas")
    
    return render(request, 'login.html', {'form': login_form})



