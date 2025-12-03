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

// Funções AJAX
async function fetchLivro(id) {
    try {
        const response = await fetch(`/api/livro/${id}/`, {
            headers: {
                'X-CSRFToken': csrftoken
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar livro:', error);
        return null;
    }
}

async function updateLivro(id, data) {
    try {
        const response = await fetch(`/api/livro/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Erro ao atualizar livro:', error);
        return { success: false, error: error.message };
    }
}

async function deleteLivro(id) {
    try {
        const response = await fetch(`/api/livro/${id}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': csrftoken
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Erro ao excluir livro:', error);
        return { success: false, error: error.message };
    }
}

// Variáveis para controle
let livroParaExcluir = null;
let livroParaEditar = null;

// Abre o modal de edição
document.querySelectorAll(".edit-icon").forEach((icon) => {
    icon.addEventListener("click", async function() {
        const livroId = this.getAttribute("data-id");
        
        // Busca dados do livro
        const livro = await fetchLivro(livroId);
        if (livro) {
            // Preenche o formulário
            document.getElementById("edit-id").value = livro.id;
            document.getElementById("edit-titulo").value = livro.titulo || '';
            document.getElementById("edit-editora").value = livro.editora || '';
            document.getElementById("edit-autores").value = livro.autores || '';
            document.getElementById("edit-ano").value = livro.ano_publicacao || '';
            document.getElementById("edit-categoria").value = livro.categoria_id || '';
            document.getElementById("edit-status").value = livro.status || 'ativo';
            
            // Abre o modal
            document.getElementById("edit-modal").classList.remove("hidden");
            livroParaEditar = livroId;
        }
    });
});

// Abre o modal de exclusão
document.querySelectorAll(".delete-icon").forEach((icon) => {
    icon.addEventListener("click", function() {
        const bookId = this.getAttribute("data-id");
        const row = this.closest("tr");
        const bookTitle = row.querySelector("td:nth-child(2)").textContent;
        
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

// Fecha modais
function closeAllModals() {
    document.querySelectorAll(".modal").forEach(modal => {
        modal.classList.add("hidden");
    });
    livroParaExcluir = null;
    livroParaEditar = null;
}

document.querySelectorAll(".close-modal, .btn-cancelar").forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
});

// Fecha modais ao clicar fora
document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal")) {
            closeAllModals();
        }
    });
});

// Submissão do formulário de edição
document.getElementById("edit-form").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    if (!livroParaEditar) return;
    
    const formData = {
        titulo: document.getElementById("edit-titulo").value,
        editora: document.getElementById("edit-editora").value,
        autores: document.getElementById("edit-autores").value,
        ano_publicacao: document.getElementById("edit-ano").value,
        categoria_id: document.getElementById("edit-categoria").value,
        status: document.getElementById("edit-status").value
    };
    
    const result = await updateLivro(livroParaEditar, formData);
    
    if (result.success) {
        alert("Livro atualizado com sucesso!");
        location.reload(); // Recarrega a página para mostrar dados atualizados
    } else {
        alert("Erro ao atualizar livro: " + result.error);
    }
});

// Confirma exclusão
document.querySelector(".btn-confirmar-exclusao").addEventListener("click", async () => {
    if (!livroParaExcluir) return;
    
    const result = await deleteLivro(livroParaExcluir.id);
    
    if (result.success) {
        // Remove a linha da tabela
        livroParaExcluir.element.remove();
        alert("Livro excluído com sucesso!");
    } else {
        alert("Erro ao excluir livro: " + result.error);
    }
    
    closeAllModals();
});

// Busca em tempo real
document.getElementById("search-input")?.addEventListener("input", function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll(".tabela-livros tbody tr");
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
    });
});