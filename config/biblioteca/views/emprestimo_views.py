# biblioteca/views/emprestimo_views.py
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from datetime import timedelta
import json
from django.db import models

from biblioteca.models import Aluno, Emprestimo, tbl_livro, tbl_usuario

@require_GET
@login_required
def buscar_alunos(request):
    """Busca alunos por nome, sobrenome ou matrícula"""
    termo = request.GET.get('q', '').strip()
    
    if not termo or len(termo) < 2:
        return JsonResponse({'alunos': []})
    
    # Busca em múltiplos campos
    alunos = Aluno.objects.filter(
        models.Q(nome__icontains=termo) |
        models.Q(sobrenome__icontains=termo) |
        models.Q(matricula__icontains=termo) |
        models.Q(email__icontains=termo)
    ).filter(ativo=True).order_by('nome')[:20]
    
    resultados = []
    for aluno in alunos:
        resultados.append({
            'id': aluno.id,
            'nome': aluno.nome,
            'sobrenome': aluno.sobrenome,
            'nome_completo': f"{aluno.nome} {aluno.sobrenome}",
            'matricula': aluno.matricula,
            'email': aluno.email,
            'telefone': aluno.telefone or '',
            'emprestimos_ativos': aluno.emprestimos.filter(status='ativo').count()
        })
    
    return JsonResponse({'alunos': resultados})

@require_POST
@login_required
def registrar_emprestimo(request):
    """Registra um novo empréstimo"""
    try:
        data = json.loads(request.body)
        
        livro_id = data.get('livro_id')
        aluno_id = data.get('aluno_id')
        dias_emprestimo = int(data.get('dias_emprestimo', 10))
        observacoes = data.get('observacoes', '')
        
        # Validações
        livro = get_object_or_404(tbl_livro, id_livro=livro_id)
        aluno = get_object_or_404(Aluno, id=aluno_id, ativo=True)
        
        # Verificar disponibilidade
        disponivel = livro.quantidade or 0
        emprestados_ativos = livro.emprestimos.filter(status='ativo').count()
        
        if (disponivel - emprestados_ativos) <= 0:
            return JsonResponse({
                'success': False,
                'error': 'Livro não disponível para empréstimo'
            })
        
        # Verificar se aluno já tem este livro emprestado
        if livro.emprestimos.filter(aluno=aluno, status='ativo').exists():
            return JsonResponse({
                'success': False,
                'error': 'Aluno já possui este livro emprestado'
            })
        
        # Calcular datas
        dt_emprestimo = timezone.now()
        dt_devolucao_prevista = dt_emprestimo.date() + timedelta(days=dias_emprestimo)
        
        # Criar empréstimo
        emprestimo = Emprestimo.objects.create(
            livro=livro,
            aluno=aluno,
            funcionario=request.user,
            dt_emprestimo=dt_emprestimo,
            dt_devolucao_prevista=dt_devolucao_prevista,
            observacoes=observacoes,
            status='ativo'
        )
        
        return JsonResponse({
            'success': True,
            'emprestimo_id': emprestimo.id,
            'mensagem': f'Empréstimo registrado com sucesso! Devolução prevista para {dt_devolucao_prevista.strftime("%d/%m/%Y")}'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

@login_required
def emprestimo_list(request):
    """Lista todos os empréstimos"""
    emprestimos = Emprestimo.objects.all().select_related('livro', 'aluno', 'funcionario')
    return render(request, 'emprestimo/emprestimo_list.html', {
        'emprestimos': emprestimos
    })