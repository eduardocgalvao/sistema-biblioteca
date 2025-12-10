from django.contrib import admin
from . import models


@admin.register(models.tbl_editora)
class EditoraAdmin(admin.ModelAdmin):
    list_display = ("nome", "cidade")
    search_fields = ("nome", "cidade")


@admin.register(models.tbl_autor)
class AutorAdmin(admin.ModelAdmin):
    list_display = ("nome", "sobrenome")
    search_fields = ("nome", "sobrenome")


@admin.register(models.tbl_categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ("nome",)


@admin.register(models.tbl_status_livro)
class StatusLivroAdmin(admin.ModelAdmin):
    list_display = ("descricao", "ativo")


@admin.register(models.tbl_livro)
class LivroAdmin(admin.ModelAdmin):
    list_display = ("titulo", "isbn", "ano_publicacao", "quantidade", "editora", "status")
    search_fields = ("titulo", "isbn")
    list_filter = ("status", "editora")
    readonly_fields = ("status",)


admin.site.register(models.tbl_livro_autor)
admin.site.register(models.tbl_livro_categoria)


@admin.register(models.tbl_usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ("email", "nome", "sobrenome", "is_staff", "is_active")
    search_fields = ("email", "nome")


@admin.register(models.Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ("nome", "sobrenome", "matricula", "ativo")
    search_fields = ("nome", "matricula")


@admin.register(models.Emprestimo)
class EmprestimoAdmin(admin.ModelAdmin):
    list_display = ("livro", "aluno", "dt_emprestimo", "status")
    list_filter = ("status",)
