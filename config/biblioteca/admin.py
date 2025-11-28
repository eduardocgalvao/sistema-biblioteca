from django.contrib import admin
from . import models


# Registra todos os modelos do app `biblioteca` no admin.
# Você pode customizar a exibição (list_display, search_fields, etc.) conforme necessário.
admin.site.register(models.tbl_editora)
admin.site.register(models.tbl_autor)
admin.site.register(models.tbl_categoria)
admin.site.register(models.tbl_status_livro)
admin.site.register(models.tbl_livro)
admin.site.register(models.tbl_livro_autor)
admin.site.register(models.tbl_livro_categoria)
admin.site.register(models.tbl_usuario)
admin.site.register(models.tbl_motivo_remocao)
admin.site.register(models.tbl_livro_remocao)
