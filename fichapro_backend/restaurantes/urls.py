from rest_framework import routers
from .views import RestauranteViewSet, InsumoViewSet, ReceitaViewSet, ReceitaInsumoViewSet, FichaTecnicaViewSet, FichaTecnicaItemViewSet, MeusPerfisView, MeView, UserViewSet, UserCreateView, RegistroAtividadeViewSet
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'restaurantes', RestauranteViewSet)
router.register(r'insumos', InsumoViewSet)
router.register(r'receitas', ReceitaViewSet)
router.register(r'receita-insumos', ReceitaInsumoViewSet)
router.register(r'fichas-tecnicas', FichaTecnicaViewSet)
router.register(r'ficha-tecnica-itens', FichaTecnicaItemViewSet)
router.register(r'usuarios', UserViewSet)
router.register(r'registros-atividade', RegistroAtividadeViewSet, basename='registroatividade')

urlpatterns = [
    path('meus-perfis/', MeusPerfisView.as_view(), name='meus-perfis'),
    path('me/', MeView.as_view(), name='me'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('usuarios/criar/', UserCreateView.as_view(), name='criar_usuario'),
] + router.urls 