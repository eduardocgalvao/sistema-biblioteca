// todos_livros.js - VERSÃO COMPLETA COM ATUALIZAÇÃO DE CAPA
console.log("Script todos_livros.js carregado");

// Variáveis globais
let capaOriginalUrl = null;
let novaCapaFile = null;
let livroParaExcluir = null;
let livroParaEditar = null;
let autoresSelect2Instance = null;

// Configuração do CSRF para AJAX
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

const csrftoken = getCookie('csrftoken');

console.log("API_URLS:", window.API_URLS);
console.log("CSRF Token:", csrftoken ? "Encontrado" : "Não encontrado");

// ========== FUNÇÕES AJAX ==========

async function fetchLivro(id) {
    console.log(`Buscando livro ID: ${id}`);
    try {
        const url = `/api/livro/${id}/`;
        console.log("URL:", url);
        
        const response = await fetch(url, {
            headers: {
                'X-CSRFToken': csrftoken,
                'Accept': 'application/json'
            }
        });
        
        console.log("Status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erro HTTP ${response.status}:`, errorText);
            throw new Error(`Erro ${response.status}: Não foi possível carregar o livro`);
        }
        
        const data = await response.json();
        console.log("Dados recebidos:", data);
        return data;
        
    } catch (error) {
        console.error('Erro ao buscar livro:', error);
        alert('Erro ao carregar dados do livro: ' + error.message);
        return null;
    }
}

// FUNÇÃO ATUALIZADA: updateLivro com suporte a FormData
async function updateLivro(id, data, isFormData = false) {
    console.log(`Atualizando livro ID: ${id}`);
    
    try {
        const url = `/api/livro/${id}/update/`;
        console.log("URL:", url);
        
        let requestOptions = {
            method: 'PUT',
            headers: {
                'X-CSRFToken': csrftoken,
            }
        };
        
        if (isFormData) {
            // Usa FormData (para envio de arquivos)
            requestOptions.body = data;
            console.log("Enviando FormData com arquivo");
        } else {
            // Usa JSON (modo antigo)
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.headers['Accept'] = 'application/json';
            requestOptions.body = JSON.stringify(data);
            console.log("Enviando JSON:", data);
        }
        
        const response = await fetch(url, requestOptions);
        console.log("Status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erro HTTP ${response.status}:`, errorText);
            throw new Error(`Erro ${response.status}: Não foi possível atualizar o livro`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Erro ao atualizar livro:', error);
        return { 
            success: false, 
            error: error.message || 'Erro desconhecido ao atualizar' 
        };
    }
}

async function deleteLivro(id) {
    console.log(`Excluindo livro ID: ${id}`);
    try {
        const url = `/api/livro/${id}/delete/`;
        console.log("URL:", url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': csrftoken,
                'Accept': 'application/json'
            }
        });
        
        console.log("Status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erro HTTP ${response.status}:`, errorText);
            throw new Error(`Erro ${response.status}: Não foi possível excluir o livro`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Erro ao excluir livro:', error);
        return { 
            success: false, 
            error: error.message || 'Erro desconhecido ao excluir' 
        };
    }
}

// ========== FUNÇÕES AUXILIARES ==========

function inicializarSelect2Autores() {
    if (!autoresSelect2Instance && $('#edit-autores').length) {
        autoresSelect2Instance = $('#edit-autores').select2({
            width: '100%',
            placeholder: 'Selecione os autores',
            allowClear: true,
            dropdownParent: $('#edit-modal')
        });
        console.log("Select2 inicializado para autores");
    }
}

function limparSelect2Autores() {
    if (autoresSelect2Instance) {
        autoresSelect2Instance.val(null).trigger('change');
    }
}

function closeAllModals() {
    document.querySelectorAll(".modal").forEach(modal => {
        modal.classList.add("hidden");
    });
    livroParaExcluir = null;
    livroParaEditar = null;
    limparSelect2Autores();
    console.log("Todos os modais fechados");
}

function validarImagem(file) {
    // Valida tamanho (5MB = 5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
        alert("A imagem é muito grande. Tamanho máximo: 5MB");
        return false;
    }
    
    // Valida tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
        alert("Formato de imagem inválido. Use JPG, PNG, GIF ou WebP.");
        return false;
    }
    
    return true;
}

// ========== CONFIGURAÇÃO DOS EVENTOS ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado, configurando eventos...");
    
    // ========== EVENTO: ABRIR MODAL DE EDIÇÃO ==========
    const editIcons = document.querySelectorAll(".edit-icon");
    console.log(`Encontrados ${editIcons.length} ícones de edição`);
    
    editIcons.forEach((icon) => {
        icon.addEventListener("click", async function() {
            const livroId = this.getAttribute("data-id");
            console.log(`Clicou em editar livro ID: ${livroId}`);

            // Resetar variáveis da capa
            capaOriginalUrl = null;
            novaCapaFile = null;
            const removeCapaCheckbox = document.getElementById('remove-capa');
            const capaInput = document.getElementById('edit-capa');
            
            if (removeCapaCheckbox) removeCapaCheckbox.checked = false;
            if (capaInput) capaInput.value = '';
            
            // Busca dados do livro
            const livro = await fetchLivro(livroId);
            if (livro) {
                console.log("Dados do livro para edição:", livro);
                
                // Preenche o formulário
                document.getElementById("edit-id").value = livro.id;
                document.getElementById("edit-titulo").value = livro.titulo || '';
                document.getElementById("edit-editora").value = livro.editora_id || '';
                document.getElementById("edit-ano").value = livro.ano_publicacao || '';
                document.getElementById("edit-categoria").value = livro.categoria_id || '';
                document.getElementById("edit-status").value = livro.status_id || '';
                document.getElementById("edit-descricao").value = livro.descricao || '';
                
                // Inicializa Select2 se ainda não foi
                inicializarSelect2Autores();
                
                // Preenche os autores no Select2
                if (livro.autores_ids && Array.isArray(livro.autores_ids)) {
                    $('#edit-autores').val(livro.autores_ids).trigger('change');
                    console.log("Autores preenchidos:", livro.autores_ids);
                } else {
                    $('#edit-autores').val(null).trigger('change');
                }

                // Preenche a preview da capa
                const previewImg = document.getElementById('capa-preview-img');
                const placeholder = document.getElementById('capa-placeholder');
                
                if (livro.capa_url) {
                    capaOriginalUrl = livro.capa_url;
                    previewImg.src = livro.capa_url;
                    previewImg.style.display = 'block';
                    if (placeholder) placeholder.style.display = 'none';
                    console.log("Capa carregada:", livro.capa_url);
                } else {
                    previewImg.style.display = 'none';
                    if (placeholder) placeholder.style.display = 'flex';
                }
                
                // Abre o modal
                document.getElementById("edit-modal").classList.remove("hidden");
                livroParaEditar = livroId;
            } else {
                alert("Não foi possível carregar os dados do livro para edição");
            }
        });
    });

    // ========== EVENTO: MUDANÇA NA INPUT DE CAPA ==========
    const capaInput = document.getElementById('edit-capa');
    if (capaInput) {
        capaInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Valida a imagem
                if (!validarImagem(file)) {
                    this.value = '';
                    return;
                }
                
                novaCapaFile = file;
                
                // Criar preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewImg = document.getElementById('capa-preview-img');
                    const placeholder = document.getElementById('capa-placeholder');
                    
                    if (previewImg) {
                        previewImg.src = e.target.result;
                        previewImg.style.display = 'block';
                    }
                    if (placeholder) placeholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
                
                // Desmarcar o checkbox de remover capa
                const removeCapaCheckbox = document.getElementById('remove-capa');
                if (removeCapaCheckbox) removeCapaCheckbox.checked = false;
                
                console.log("Nova capa selecionada:", file.name);
            }
        });
    }

    // ========== EVENTO: REMOVER CAPA ==========
    const removeCapaCheckbox = document.getElementById('remove-capa');
    if (removeCapaCheckbox) {
        removeCapaCheckbox.addEventListener('change', function(e) {
            if (this.checked) {
                // Limpar o input de arquivo
                const capaInput = document.getElementById('edit-capa');
                if (capaInput) capaInput.value = '';
                novaCapaFile = null;
                
                // Mostrar placeholder
                const previewImg = document.getElementById('capa-preview-img');
                const placeholder = document.getElementById('capa-placeholder');
                
                if (previewImg) previewImg.style.display = 'none';
                if (placeholder) placeholder.style.display = 'flex';
                
                console.log("Remover capa ativado");
            }
        });
    }

    // ========== EVENTO: ABRIR MODAL DE EXCLUSÃO ==========
    const deleteIcons = document.querySelectorAll(".delete-icon");
    console.log(`Encontrados ${deleteIcons.length} ícones de exclusão`);
    
    deleteIcons.forEach((icon) => {
        icon.addEventListener("click", function() {
            const bookId = this.getAttribute("data-id");
            const row = this.closest("tr");
            const bookTitle = row.querySelector("td:nth-child(3)").textContent;
            
            console.log(`Clicou em excluir livro ID: ${bookId} - "${bookTitle}"`);
            
            livroParaExcluir = {
                id: bookId,
                element: row,
                title: bookTitle
            };
            
            // Mostra o título do livro no modal
            document.getElementById("delete-book-title").textContent = `"${bookTitle}"`;
            document.getElementById("delete-modal").classList.remove("hidden");
        });
    });

    // ========== EVENTO: FECHAR MODAIS ==========
    const closeButtons = document.querySelectorAll(".close-modal, .btn-cancelar");
    console.log(`Encontrados ${closeButtons.length} botões de fechar`);
    
    closeButtons.forEach((btn) => {
        btn.addEventListener("click", closeAllModals);
    });

    // ========== EVENTO: FECHAR MODAL AO CLICAR FORA ==========
    document.querySelectorAll(".modal").forEach((modal) => {
        modal.addEventListener("click", (e) => {
            if (e.target.classList.contains("modal")) {
                closeAllModals();
            }
        });
    });

    // ========== EVENTO: SUBMIT DO FORMULÁRIO DE EDIÇÃO ==========
    const editForm = document.getElementById("edit-form");
    if (editForm) {
        console.log("Formulário de edição encontrado");
        editForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            console.log("Formulário de edição submetido");
            
            if (!livroParaEditar) {
                alert("Nenhum livro selecionado para edição");
                return;
            }
            
            // Verifica se há uma nova capa ou se quer remover a capa
            const removeCapa = document.getElementById('remove-capa')?.checked || false;
            const temNovaCapa = novaCapaFile !== null;
            const deveEnviarFormData = temNovaCapa || removeCapa;
            
            // Pega os autores selecionados no Select2
            const autoresSelecionados = $('#edit-autores').val() || [];
            console.log("Autores selecionados:", autoresSelecionados);
            
            let result;
            
            if (deveEnviarFormData) {
                // Usa FormData para enviar arquivos
                const formData = new FormData();
                
                // Adiciona campos básicos
                formData.append('titulo', document.getElementById("edit-titulo").value);
                formData.append('editora_id', document.getElementById("edit-editora").value);
                formData.append('ano_publicacao', document.getElementById("edit-ano").value);
                formData.append('categoria_id', document.getElementById("edit-categoria").value);
                formData.append('status_id', document.getElementById("edit-status").value);
                formData.append('descricao', document.getElementById("edit-descricao").value);
                
                // Adiciona autores como JSON string
                formData.append('autores_ids', JSON.stringify(autoresSelecionados));
                
                // Adiciona capa se houver nova
                if (temNovaCapa) {
                    formData.append('capa', novaCapaFile);
                    console.log("Enviando nova capa:", novaCapaFile.name);
                }
                
                // Adiciona flag para remover capa
                if (removeCapa) {
                    formData.append('remove_capa', 'true');
                    console.log("Flag para remover capa enviada");
                }
                
                console.log("Enviando FormData com capa");
                result = await updateLivro(livroParaEditar, formData, true);
                
            } else {
                // Usa JSON normal (sem capa)
                const formData = {
                    titulo: document.getElementById("edit-titulo").value,
                    editora_id: document.getElementById("edit-editora").value,
                    ano_publicacao: document.getElementById("edit-ano").value,
                    categoria_id: document.getElementById("edit-categoria").value,
                    status_id: document.getElementById("edit-status").value,
                    descricao: document.getElementById("edit-descricao").value,
                    autores_ids: autoresSelecionados
                };
                
                console.log("Enviando JSON sem capa");
                result = await updateLivro(livroParaEditar, formData, false);
            }
            
            console.log("Resultado da atualização:", result);
            
            if (result.success) {
                alert("Livro atualizado com sucesso!");
                // Pequeno delay antes de recarregar
                setTimeout(() => {
                    location.reload();
                }, 500);
            } else {
                alert("Erro ao atualizar livro: " + (result.error || "Erro desconhecido"));
            }
        });
    } else {
        console.error("Formulário de edição NÃO encontrado!");
    }

    // ========== EVENTO: CONFIRMAR EXCLUSÃO ==========
    const confirmDeleteBtn = document.querySelector(".btn-confirmar-exclusao");
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", async () => {
            console.log("Botão de confirmação de exclusão clicado");
            
            if (!livroParaExcluir) {
                alert("Nenhum livro selecionado para exclusão");
                return;
            }
            
            const result = await deleteLivro(livroParaExcluir.id);
            console.log("Resultado da exclusão:", result);
            
            if (result.success) {
                // Remove a linha da tabela
                livroParaExcluir.element.remove();
                alert("Livro excluído com sucesso!");
            } else {
                alert("Erro ao excluir livro: " + (result.error || "Erro desconhecido"));
            }
            
            closeAllModals();
        });
    }

    // ========== EVENTO: BUSCA EM TEMPO REAL ==========
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll(".tabela-livros tbody tr");
            let visibleCount = 0;
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = "";
                    visibleCount++;
                } else {
                    row.style.display = "none";
                }
            });
            
            console.log(`Busca: "${searchTerm}" - ${visibleCount} livros encontrados`);
        });
    }
    
    console.log("Configuração de eventos concluída");
});