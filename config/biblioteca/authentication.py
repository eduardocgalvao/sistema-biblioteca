from django.contrib.auth.backends import ModelBackend
from .models import tbl_usuario

class TblUsuarioBackend(ModelBackend):
    """
    Backend customizado para autenticar usando tbl_usuario ao invés da tabela User padrão
    """
    
    def authenticate(self, request, email=None, **kwargs):
        try:
            usuario = tbl_usuario.objects.get(email=email)
            return usuario
        except tbl_usuario.DoesNotExist:
            return None
    
    def get_user(self, user_id):
        try:
            return tbl_usuario.objects.get(id_usuario=user_id)
        except tbl_usuario.DoesNotExist:
            return None
    
    def get_user_permissions(self, user_obj):
        return set()
    
    def get_group_permissions(self, user_obj):
        return set()
    
    def get_all_permissions(self, user_obj):
        return set()
