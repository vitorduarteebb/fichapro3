from django.contrib.auth import get_user_model
from restaurantes.models import Restaurante, UsuarioRestaurantePerfil

User = get_user_model()

try:
    admin = User.objects.get(username='admin')
except User.DoesNotExist:
    print('Usuário admin não encontrado.')
    exit()

restaurante = Restaurante.objects.first()
if not restaurante:
    print('Nenhum restaurante cadastrado.')
    exit()

if not UsuarioRestaurantePerfil.objects.filter(usuario=admin, restaurante=restaurante, perfil='Administrador').exists():
    UsuarioRestaurantePerfil.objects.create(
        usuario=admin,
        restaurante=restaurante,
        perfil='Administrador'
    )
    print(f'Vínculo de admin como Administrador criado para o restaurante: {restaurante.nome}')
else:
    print('Vínculo já existe.') 