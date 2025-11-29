from django.shortcuts import redirect, render
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
            request.session['usuario_sobrenome'] = usuario.sobrenome
            request.session['usuario_email'] = usuario.email
            return redirect('tela_inicial')
        else:
            print("Usuário não encontrado ou credenciais inválidas")
    
    return render(request, 'login.html')

def tela_inicial(request):
    """
    Exibe a tela inicial após o login.
    Mostra informações básicas do usuário logado.
    """
    usuario_nome = request.session.get('usuario_nome', 'Visitante')
    
    context = {
        'usuario_nome': usuario_nome,
    }
    
    return render(request, 'tela_inicial.html', context)