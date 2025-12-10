// biblioteca/static/js/livro/emprestimo.js
$(document).ready(function() {
    // Variáveis
    let alunoSelecionado = null;
    let livroAtual = null;
    
    // Abrir modal de empréstimo
    $(document).on('click', '.emprestar-icon:not(.disabled)', function() {
        const livroId = $(this).data('id');
        const livroTitulo = $(this).closest('tr').find('td:nth-child(3)').text().trim();
        const disponivel = $(this).closest('tr').find('.quantidade-disponivel').text().trim();
        
        livroAtual = {
            id: livroId,
            titulo: livroTitulo,
            disponivel: parseInt(disponivel)
        };
        
        // Preencher informações no modal
        $('#emprestar-livro-id').val(livroId);
        $('#emprestar-livro-titulo').val(livroTitulo);
        $('#modal-livro-titulo').text(livroTitulo);
        $('#modal-livro-disponivel').text(disponivel);
        $('#resumo-livro').text(livroTitulo);
        
        // Resetar aluno selecionado
        resetarAluno();
        
        // Calcular data de devolução padrão
        calcularDataDevolucao();
        
        // Atualizar resumo
        atualizarResumo();
        
        // Abrir modal
        abrirModal('#emprestar-modal');
    });
    
    // Buscar alunos
    $('#btn-buscar-aluno').click(buscarAlunos);
    $('#buscar-aluno').on('keypress', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            buscarAlunos();
        }
    });
    
    // Alterar data de devolução baseada nos dias
    $('#dias-emprestimo').change(calcularDataDevolucao);
    
    // Alterar aluno
    $('#btn-alterar-aluno').click(function() {
        resetarAluno();
    });
    
    // Atualizar data de devolução quando o campo for alterado
    $('#data-devolucao').change(atualizarResumo);
    
    // Submeter formulário de empréstimo
    $('#emprestar-form').submit(function(e) {
        e.preventDefault();
        registrarEmprestimo();
    });
    
    // Funções
    function buscarAlunos() {
        const termo = $('#buscar-aluno').val().trim();
        
        if (termo.length < 2) {
            alert('Digite pelo menos 2 caracteres para buscar');
            return;
        }
        
        $.ajax({
            url: window.API_URLS.buscarAlunos,
            method: 'GET',
            data: { q: termo },
            success: function(response) {
                exibirResultadosAlunos(response.alunos);
            },
            error: function(xhr, status, error) {
                console.error('Erro ao buscar alunos:', error);
                alert('Erro ao buscar alunos. Tente novamente.');
            }
        });
    }
    
    function exibirResultadosAlunos(alunos) {
        const $lista = $('#lista-alunos');
        $lista.empty();
        
        if (alunos.length === 0) {
            $lista.html('<p class="nenhum-resultado">Nenhum aluno encontrado.</p>');
        } else {
            alunos.forEach(aluno => {
                const $item = $(`
                    <div class="item-aluno" data-id="${aluno.id}">
                        <h6>${aluno.nome_completo}</h6>
                        <p><strong>Matrícula:</strong> ${aluno.matricula}</p>
                        <p><strong>Email:</strong> ${aluno.email}</p>
                        <p><strong>Empréstimos ativos:</strong> ${aluno.emprestimos_ativos}</p>
                    </div>
                `);
                
                $item.click(function() {
                    selecionarAluno(aluno);
                });
                
                $lista.append($item);
            });
        }
        
        $('#resultados-aluno').removeClass('hidden');
    }
    
    function selecionarAluno(aluno) {
        alunoSelecionado = aluno;
        
        // Atualizar interface
        $('#aluno-id').val(aluno.id);
        $('#aluno-nome').text(aluno.nome_completo);
        $('#aluno-matricula').text(aluno.matricula);
        $('#aluno-email').text(aluno.email);
        
        $('#info-aluno-selecionado').removeClass('hidden');
        $('#resultados-aluno').addClass('hidden');
        $('#buscar-aluno').val('');
        
        // Habilitar botão de confirmação
        $('.btn-confirmar-emprestimo').prop('disabled', false);
        
        // Atualizar resumo
        atualizarResumo();
    }
    
    function resetarAluno() {
        alunoSelecionado = null;
        
        $('#aluno-id').val('');
        $('#info-aluno-selecionado').addClass('hidden');
        $('#resultados-aluno').addClass('hidden');
        $('#buscar-aluno').val('');
        $('#lista-alunos').empty();
        
        $('.btn-confirmar-emprestimo').prop('disabled', true);
        
        atualizarResumo();
    }
    
    function calcularDataDevolucao() {
        const dias = parseInt($('#dias-emprestimo').val());
        const hoje = new Date();
        const dataDevolucao = new Date(hoje);
        dataDevolucao.setDate(hoje.getDate() + dias);
        
        // Formatar para YYYY-MM-DD
        const formattedDate = dataDevolucao.toISOString().split('T')[0];
        $('#data-devolucao').val(formattedDate);
        
        atualizarResumo();
    }
    
    function atualizarResumo() {
        // Atualizar aluno no resumo
        if (alunoSelecionado) {
            $('#resumo-aluno').text(alunoSelecionado.nome_completo);
        } else {
            $('#resumo-aluno').text('-');
        }
        
        // Atualizar data de devolução no resumo
        const dataDevolucao = $('#data-devolucao').val();
        if (dataDevolucao) {
            const [ano, mes, dia] = dataDevolucao.split('-');
            $('#resumo-data-devolucao').text(`${dia}/${mes}/${ano}`);
        } else {
            $('#resumo-data-devolucao').text('-');
        }
        
        // Data atual
        const hoje = new Date();
        $('#resumo-data-emprestimo').text(
            `${hoje.getDate().toString().padStart(2, '0')}/` +
            `${(hoje.getMonth() + 1).toString().padStart(2, '0')}/` +
            `${hoje.getFullYear()}`
        );
    }
    
    function registrarEmpréstimo() {
        if (!alunoSelecionado) {
            alert('Selecione um aluno antes de confirmar o empréstimo.');
            return;
        }
        
        if (!livroAtual || livroAtual.disponivel <= 0) {
            alert('Livro não disponível para empréstimo.');
            return;
        }
        
        const formData = {
            livro_id: livroAtual.id,
            aluno_id: alunoSelecionado.id,
            dias_emprestimo: $('#dias-emprestimo').val(),
            observacoes: $('#observacoes').val()
        };
        
        $.ajax({
            url: window.API_URLS.registrarEmprestimo,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            headers: {
                'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]').val()
            },
            success: function(response) {
                if (response.success) {
                    alert(response.mensagem);
                    fecharModal('#emprestar-modal');
                    location.reload(); // Recarregar para atualizar disponibilidade
                } else {
                    alert('Erro: ' + response.error);
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro ao registrar empréstimo:', error);
                alert('Erro ao registrar empréstimo. Tente novamente.');
            }
        });
    }
    
    function abrirModal(selector) {
        $(selector).removeClass('hidden');
        $('body').css('overflow', 'hidden');
    }
    
    function fecharModal(selector) {
        $(selector).addClass('hidden');
        $('body').css('overflow', 'auto');
        resetarAluno();
    }
    
    // Fechar modal ao clicar no X ou fora
    $('.close-modal, .btn-cancelar').click(function() {
        const $modal = $(this).closest('.modal');
        if ($modal.attr('id') === 'emprestar-modal') {
            resetarAluno();
        }
        $modal.addClass('hidden');
        $('body').css('overflow', 'auto');
    });
});