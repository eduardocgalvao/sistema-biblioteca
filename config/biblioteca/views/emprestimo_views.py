from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from datetime import datetime
import json
from django.db import models, transaction

from biblioteca.models import Aluno, Emprestimo, tbl_livro, tbl_status_livro

# BUSCA DE ALUNOS
@require_GET
@login_required
def buscar_alunos(request):
    termo = request.GET.get('q', '').strip()

    if not termo or len(termo) < 2:
        return JsonResponse({'alunos': []})

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

# REGISTRO DE EMPRÉSTIMO
@require_POST
@login_required
def registrar_emprestimo(request):
    """
    Registra um novo empréstimo:
    - Usa select_for_update no livro para evitar race conditions
    - Decrementa livro.quantidade
    - Cria o Emprestimo
    - Atualiza o status do livro ("Disponível" / "Indisponível")
    """
    try:
        try:
            data = json.loads(request.body.decode('utf-8'))
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'JSON inválido'})

        livro_id = data.get('livro_id')
        aluno_id = data.get('aluno_id')
        data_devolucao_str = data.get('data_devolucao')
        observacoes = data.get('observacoes', '').strip()

        if not livro_id or not aluno_id:
            return JsonResponse({'success': False, 'error': 'Livro e aluno são obrigatórios'})

        if not data_devolucao_str:
            return JsonResponse({'success': False, 'error': 'Data de devolução é obrigatória'})

        try:
            dt_devolucao_prevista = datetime.strptime(data_devolucao_str, "%Y-%m-%d").date()
        except ValueError:
            return JsonResponse({'success': False, 'error': 'Data de devolução inválida'})

        dt_emprestimo = timezone.now()

        # Bloqueia a linha do livro para esta transação
        with transaction.atomic():
            livro = tbl_livro.objects.select_for_update().get(id_livro=livro_id)
            aluno = get_object_or_404(Aluno, id=aluno_id, ativo=True)

            # Disponibilidade física: quantidade > 0
            if (livro.quantidade or 0) <= 0:
                return JsonResponse({'success': False, 'error': 'Livro não disponível para empréstimo'})

            # Verificar se aluno já tem este livro emprestado
            if livro.emprestimos.filter(aluno=aluno, status='ativo').exists():
                return JsonResponse({'success': False, 'error': 'Aluno já possui este livro emprestado'})

            # Decrementa a quantidade física
            livro.quantidade = (livro.quantidade or 0) - 1

            # Atualiza status do livro baseado na nova quantidade
            try:
                if livro.quantidade > 0:
                    status_obj = tbl_status_livro.objects.get(descricao='Disponível')
                else:
                    status_obj = tbl_status_livro.objects.get(descricao='Indisponível')
                livro.status = status_obj
            except tbl_status_livro.DoesNotExist:
                # Se os status obrigatórios não existirem, abortamos com erro claro
                return JsonResponse({'success': False, 'error': "Status 'Disponível' ou 'Indisponível' inexistente no banco"})

            livro.save()  # salva quantidade e status antes de criar empréstimo

            # Cria empréstimo
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

    except tbl_livro.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Livro não encontrado'})
    except Aluno.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Aluno não encontrado'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': f'Erro interno: {str(e)}'})


@require_POST
@login_required
def registrar_devolucao(request):
    """
    Recebe JSON: { emprestimo_id: int, observacoes: optional }
    Realiza:
    - marca emprestimo.status = 'devolvido'
    - define dt_devolucao_real = now
    - incrementa livro.quantidade
    - atualiza status do livro para 'Disponível' se quantidade > 0
    """
    try:
        try:
            data = json.loads(request.body.decode('utf-8'))
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'JSON inválido'})

        emprestimo_id = data.get('emprestimo_id')
        observacoes_extra = data.get('observacoes', '').strip()

        if not emprestimo_id:
            return JsonResponse({'success': False, 'error': 'emprestimo_id obrigatório'})

        with transaction.atomic():
            emprestimo = Emprestimo.objects.select_for_update().select_related('livro').get(id=emprestimo_id)

            # Já devolvido?
            if emprestimo.status == 'devolvido':
                return JsonResponse({'success': False, 'error': 'Empréstimo já está devolvido'})

            # Atualiza empréstimo
            emprestimo.status = 'devolvido'
            emprestimo.dt_devolucao_real = timezone.now()
            if observacoes_extra:
                emprestimo.observacoes = (emprestimo.observacoes or '') + f"\n[Devolução] {observacoes_extra}"
            emprestimo.save()

            # Atualiza livro (incrementa quantidade)
            livro = emprestimo.livro
            livro.quantidade = (livro.quantidade or 0) + 1

            # Atualiza status do livro (Disponível se há ao menos 1 unidade)
            try:
                disponivel_obj = tbl_status_livro.objects.get(descricao='Disponível')
                indisponivel_obj = tbl_status_livro.objects.get(descricao='Indisponível')
            except tbl_status_livro.DoesNotExist:
                return JsonResponse({'success': False, 'error': "Status 'Disponível'/'Indisponível' inexistente no banco"})

            if livro.quantidade > 0:
                livro.status = disponivel_obj
            else:
                livro.status = indisponivel_obj

            livro.save()

        return JsonResponse({'success': True, 'mensagem': 'Devolução registrada com sucesso'})

    except Emprestimo.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Empréstimo não encontrado'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': f'Erro interno: {str(e)}'})