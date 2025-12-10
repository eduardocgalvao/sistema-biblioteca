// biblioteca/static/js/livro/emprestimo.js
$(document).ready(function () {
    let alunoSelecionado = null;
    let livroAtual = null;

    // helper: pega csrf (input ou cookie)
    function getCSRFToken() {
        const tokenFromInput = $('input[name="csrfmiddlewaretoken"]').val();
        if (tokenFromInput) return tokenFromInput;
        // fallback para cookie (nome padrão do Django)
        function getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
        return getCookie('csrftoken');
    }

    // ============= abrir modal =============
    $(document).on('click', '.emprestar-icon:not(.disabled)', function () {
        const $tr = $(this).closest('tr');

        // use data-* do tr; seu template já tem data-id e data-titulo e data-disponivel
        const livroId = $tr.data('id') || $(this).data('id');
        const livroTitulo = $tr.data('titulo') || $tr.find('td:nth-child(3)').text().trim();
        let disponivel = $tr.data('disponivel');
        if (typeof disponivel === 'undefined') {
            // fallback: buscar do texto e garantir número
            disponivel = parseInt($tr.find('.quantidade-disponivel').text().trim()) || 0;
        }

        livroAtual = {
            id: livroId,
            titulo: livroTitulo,
            disponivel: parseInt(disponivel, 10) || 0
        };

        // preencher modal
        $('#emprestar-livro-id').val(livroAtual.id);
        $('#emprestar-livro-titulo').val(livroAtual.titulo);
        $('#modal-livro-titulo').text(livroAtual.titulo);
        $('#modal-livro-disponivel').text(livroAtual.disponivel);
        $('#resumo-livro').text(livroAtual.titulo);

        resetarAluno();
        calcularDataDevolucao();
        atualizarResumo();
        abrirModal('#emprestar-modal');
    });

    // ============= buscar aluno =============
    $('#btn-buscar-aluno').on('click', buscarAlunos);
    $('#buscar-aluno').on('keypress', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            buscarAlunos();
        }
    });

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
            success: function (response) {
                exibirResultadosAlunos(response.alunos || []);
            },
            error: function (xhr, status, error) {
                console.error('Erro ao buscar alunos:', error);
                alert('Erro ao buscar alunos. Tente novamente.');
            }
        });
    }

    function exibirResultadosAlunos(alunos) {
        const $lista = $('#lista-alunos');
        $lista.empty();

        if (!alunos || alunos.length === 0) {
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
                $item.on('click', function () { selecionarAluno(aluno); });
                $lista.append($item);
            });
        }

        $('#resultados-aluno').removeClass('hidden');
    }

    // ============= selecionar/resetar aluno =============
    function selecionarAluno(aluno) {
        alunoSelecionado = aluno;

        $('#aluno-id').val(aluno.id);
        $('#aluno-nome').text(aluno.nome_completo);
        $('#aluno-matricula').text(aluno.matricula);
        $('#aluno-email').text(aluno.email);

        $('#info-aluno-selecionado').removeClass('hidden');
        $('#resultados-aluno').addClass('hidden');
        $('#buscar-aluno').val('');

        $('.btn-confirmar-emprestimo').prop('disabled', false);
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

    // ============= datas =============
    $('#dias-emprestimo').on('change', calcularDataDevolucao);
    $('#data-devolucao').on('change', atualizarResumo);

    function calcularDataDevolucao() {
        const dias = parseInt($('#dias-emprestimo').val(), 10) || 10;
        const hoje = new Date();
        hoje.setDate(hoje.getDate() + dias);
        const formatted = hoje.toISOString().split('T')[0];
        $('#data-devolucao').val(formatted);
        atualizarResumo();
    }

    function atualizarResumo() {
        $('#resumo-aluno').text(alunoSelecionado ? alunoSelecionado.nome_completo : '-');

        const dataDevolucao = $('#data-devolucao').val();
        if (dataDevolucao) {
            const [ano, mes, dia] = dataDevolucao.split('-');
            $('#resumo-data-devolucao').text(`${dia}/${mes}/${ano}`);
        } else {
            $('#resumo-data-devolucao').text('-');
        }

        const hoje = new Date();
        $('#resumo-data-emprestimo').text(
            `${hoje.getDate().toString().padStart(2, '0')}/` +
            `${(hoje.getMonth() + 1).toString().padStart(2, '0')}/` +
            `${hoje.getFullYear()}`
        );
    }

    // ============= registrar empréstimo (função única, sem acentos) ============
    function registrarEmprestimo() {
        if (!alunoSelecionado) {
            alert('Selecione um aluno antes de confirmar o empréstimo.');
            return;
        }

        if (!livroAtual || (parseInt(livroAtual.disponivel, 10) || 0) <= 0) {
            alert('Livro não disponível para empréstimo.');
            return;
        }

        const payload = {
            livro_id: livroAtual.id,
            aluno_id: alunoSelecionado.id,
            data_devolucao: $('#data-devolucao').val(),
            observacoes: $('#observacoes').val() || ''
        };

        $.ajax({
            url: window.API_URLS.registrarEmprestimo,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            headers: { 'X-CSRFToken': getCSRFToken() },
            success: function (response) {
                if (response && response.success) {
                    alert(response.mensagem || 'Empréstimo registrado.');
                    fecharModal('#emprestar-modal');
                    location.reload(); // simples e seguro; pode ser substituído por atualização parcial
                } else {
                    alert(response && response.error ? response.error : 'Erro ao registrar empréstimo');
                }
            },
            error: function (xhr) {
                // tenta extrair erro do backend
                let msg = 'Erro ao registrar empréstimo. Tente novamente.';
                try {
                    const json = xhr.responseJSON;
                    if (json && json.error) msg = json.error;
                } catch (e) { /* ignore */ }
                alert(msg);
                console.error('Erro AJAX registrar empréstimo:', xhr);
            }
        });
    }

    // ligar submit do form para chamar registrarEmprestimo (apenas 1 handler)
    $('#emprestar-form').on('submit', function (e) {
        e.preventDefault();
        registrarEmprestimo();
    });

    // ============= modais ============
    function abrirModal(selector) {
        $(selector).removeClass('hidden');
        $('body').css('overflow', 'hidden');
    }

    function fecharModal(selector) {
        $(selector).addClass('hidden');
        $('body').css('overflow', 'auto');
        resetarAluno();
    }

    $('.close-modal, .btn-cancelar').on('click', function () {
        const $modal = $(this).closest('.modal');
        if ($modal.attr('id') === 'emprestar-modal') {
            resetarAluno();
        }
        $modal.addClass('hidden');
        $('body').css('overflow', 'auto');
    });
});
