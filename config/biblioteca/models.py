from django.db import models

class tbl_editora(models.Model):
    id_editora = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255)
    endereco = models.CharField(max_length=200)
    cidade = models.CharField(max_length=200)

class tbl_autor(models.Model):
    id_autor = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255)
    sobrenome = models.CharField(max_length=255)

class tbl_categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255)

class tbl_status_livro(models.Model):
    id_status = models.AutoField(primary_key=True)
    descricao = models.CharField(max_length=255)

class tbl_livro(models.Model):
    id_livro = models.AutoField(primary_key=True)
    isbn = models.CharField(max_length=20)
    titulo = models.CharField(max_length=255)
    ano_publicacao = models.IntegerField()
    editora = models.ForeignKey(tbl_editora, on_delete=models.PROTECT)
    status = models.ForeignKey(tbl_status_livro, on_delete=models.PROTECT)
    autores = models.ManyToManyField(tbl_autor, through="tbl_livro_autor")
    categorias = models.ManyToManyField(tbl_categoria, through="tbl_livro_categoria")
    dt_criacao = models.DateTimeField(auto_now_add=True)
    dt_atualizacao = models.DateTimeField(auto_now=True)

class tbl_livro_autor(models.Model):
    livro = models.ForeignKey(tbl_livro, on_delete=models.CASCADE)
    autor = models.ForeignKey(tbl_autor, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('livro', 'autor')
    
class tbl_livro_categoria(models.Model):
    livro = models.ForeignKey(tbl_livro, on_delete=models.CASCADE)
    categoria = models.ForeignKey(tbl_categoria, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('livro', 'categoria')
     
class tbl_usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    
class tbl_motivo_remocao(models.Model):
    id_motivo = models.AutoField(primary_key=True)
    descricao = models.CharField(max_length=255)
    
class tbl_livro_remocao(models.Model):
    id_remocao = models.AutoField(primary_key=True)
    livro = models.ForeignKey(tbl_livro, on_delete=models.PROTECT)
    motivo = models.ForeignKey(tbl_motivo_remocao, on_delete=models.PROTECT)
    dt_remocao = models.DateTimeField(auto_now_add=True)
    removido_por = models.ForeignKey(tbl_usuario, on_delete=models.PROTECT)