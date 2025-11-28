"""
========================================
ADMIN.PY - Configuração do Django Admin
========================================

Arquivo responsável por registrar os modelos da aplicação 'biblioteca'
no painel administrativo do Django (Django Admin).

Cada modelo registrado pode ser gerenciado através da interface web
do Django Admin, permitindo criar, ler, atualizar e deletar registros
de forma intuitiva.

Nota: Para customizações avançadas (filtros, busca, paginação, etc),
utilize ModelAdmin classes customizadas conforme necessário.
"""

# Importa o módulo admin do Django para registrar modelos
from django.contrib import admin

# Importa todos os modelos definidos em models.py
from . import models


# ========================================
# REGISTROS DE MODELOS
# ========================================

# Modelo: tbl_editora
# Descrição: Tabela que armazena informações das editoras de livros
# Campos: id_editora, nome, endereco, cidade
admin.site.register(models.tbl_editora)

# Modelo: tbl_autor
# Descrição: Tabela que armazena informações dos autores de livros
# Campos: id_autor, nome, sobrenome
admin.site.register(models.tbl_autor)

# Modelo: tbl_categoria
# Descrição: Tabela que armazena as categorias/gêneros de livros
# Campos: id_categoria, nome
admin.site.register(models.tbl_categoria)

# Modelo: tbl_status_livro
# Descrição: Tabela que define os possíveis status de um livro (ativo, inativo, removido, etc)
# Campos: id_status, descricao
admin.site.register(models.tbl_status_livro)

# Modelo: tbl_livro
# Descrição: Tabela principal que armazena informações dos livros
# Campos: id_livro, isbn, titulo, ano_publicacao, editora_id, status_id, dt_criacao, dt_atualizacao
# Relacionamentos: ManyToMany com tbl_autor e tbl_categoria
admin.site.register(models.tbl_livro)

# Modelo: tbl_livro_autor
# Descrição: Tabela de associação (Many-to-Many) entre livros e autores
# Permite que um livro tenha múltiplos autores e um autor multiple livros
admin.site.register(models.tbl_livro_autor)

# Modelo: tbl_livro_categoria
# Descrição: Tabela de associação (Many-to-Many) entre livros e categorias
# Permite que um livro pertença a múltiplas categorias
admin.site.register(models.tbl_livro_categoria)

# Modelo: tbl_usuario
# Descrição: Tabela que armazena informações dos usuários do sistema
# Campos: id_usuario, nome, sobrenome, email
admin.site.register(models.tbl_usuario)

# Modelo: tbl_motivo_remocao
# Descrição: Tabela que define os motivos pelos quais um livro pode ser removido
# Campos: id_motivo, descricao
admin.site.register(models.tbl_motivo_remocao)

# Modelo: tbl_livro_remocao
# Descrição: Tabela que registra o histórico de remoções de livros do acervo
# Campos: id_remocao, livro_id, motivo_id, dt_remocao, removido_por_id
# Relacionamentos: ForeignKey com tbl_livro, tbl_motivo_remocao e tbl_usuario
admin.site.register(models.tbl_livro_remocao)

