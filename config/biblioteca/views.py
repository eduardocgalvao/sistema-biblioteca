"""Views para autenticação de usuários."""

from django.shortcuts import render
from django.contrib.auth import authenticate
from .models import tbl_usuario


def login_view(request):
    """
    Processa login do usuário através de email.
    
    GET: Retorna formulário de login vazio.
    POST: Autentica usuário e armazena dados na sessão.
    """
    if request.method == 'POST':
        email = request.POST.get("email")
        
        # Autentica usando o backend customizado (TblUsuarioBackend)
        usuario = authenticate(request, email=email)
        
        if usuario is not None:
            # Armazena dados do usuário na sessão
            request.session['usuario_id'] = usuario.id_usuario
            request.session['usuario_nome'] = usuario.nome
            request.session['usuario_email'] = usuario.email
            print("Login realizado com sucesso!")
        else:
            print("Usuário não encontrado ou credenciais inválidas")
    
    return render(request, 'login.html')




