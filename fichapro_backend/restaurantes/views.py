from django.shortcuts import render
from rest_framework import viewsets
from .models import Restaurante, Insumo, Receita, ReceitaInsumo, FichaTecnica, FichaTecnicaItem, UsuarioRestaurantePerfil, RegistroAtividade
from .serializers import RestauranteSerializer, InsumoSerializer, ReceitaSerializer, ReceitaInsumoSerializer, FichaTecnicaSerializer, FichaTecnicaItemSerializer, UsuarioRestaurantePerfilSerializer, UserSerializer, UserCreateSerializer, UserUpdateSerializer, RegistroAtividadeSerializer
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.models import User
from rest_framework.decorators import action
from django.db import transaction
from rest_framework import permissions

# Create your views here.

class RestauranteViewSet(viewsets.ModelViewSet):
    queryset = Restaurante.objects.all()
    serializer_class = RestauranteSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        restaurante = serializer.save()
        # Atualizar registro com usuário e perfil
        usuario = self.request.user
        perfil = self.get_user_perfil(usuario, restaurante)
        atualizar_registro_atividade(
            usuario=usuario,
            perfil=perfil,
            tipo="restaurante",
            acao="criado",
            nome=restaurante.nome,
            descricao=f"Restaurante {restaurante.nome} criado"
        )

    def perform_update(self, serializer):
        restaurante = serializer.save()
        # Atualizar registro com usuário e perfil
        usuario = self.request.user
        perfil = self.get_user_perfil(usuario, restaurante)
        atualizar_registro_atividade(
            usuario=usuario,
            perfil=perfil,
            tipo="restaurante",
            acao="editado",
            nome=restaurante.nome,
            descricao=f"Restaurante {restaurante.nome} editado"
        )

    def perform_destroy(self, instance):
        nome = instance.nome
        usuario = self.request.user
        perfil = self.get_user_perfil(usuario, instance)
        instance.delete()
        # Atualizar registro com usuário e perfil
        atualizar_registro_atividade(
            usuario=usuario,
            perfil=perfil,
            tipo="restaurante",
            acao="excluido",
            nome=nome,
            descricao=f"Restaurante {nome} excluído"
        )

    def get_user_perfil(self, usuario, restaurante):
        """Obtém o perfil do usuário no restaurante"""
        try:
            vinculo = UsuarioRestaurantePerfil.objects.get(usuario=usuario, restaurante=restaurante)
            return vinculo.perfil
        except UsuarioRestaurantePerfil.DoesNotExist:
            return "administrador"  # Fallback para admin

class InsumoViewSet(viewsets.ModelViewSet):
    queryset = Insumo.objects.all()
    serializer_class = InsumoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        restaurante_id = self.request.query_params.get('restaurante')
        if restaurante_id:
            qs = qs.filter(restaurante_id=restaurante_id)
        user = self.request.user
        if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
            return qs.none()
        if is_admin(user):
            return qs
        # Para usuários não-admin, buscar todos os restaurantes que eles têm acesso
        vinculos = UsuarioRestaurantePerfil.objects.filter(usuario=user)
        restaurante_ids = [v.restaurante_id for v in vinculos if v.perfil in ['master', 'redator', 'usuario_comum']]
        if restaurante_ids:
            return qs.filter(restaurante_id__in=restaurante_ids)
        return qs.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        restaurante_id = request.data.get('restaurante')
        if not (is_admin(user) or is_master(user, restaurante_id) or is_redator(user, restaurante_id)):
            raise PermissionDenied('Você não tem permissão para criar insumos.')
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        user = request.user
        restaurante_id = request.data.get('restaurante')
        if not (is_admin(user) or is_master(user, restaurante_id) or is_redator(user, restaurante_id)):
            raise PermissionDenied('Você não tem permissão para editar insumos.')
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        restaurante_id = instance.restaurante_id
        if not (is_admin(user) or is_master(user, restaurante_id) or is_redator(user, restaurante_id)):
            raise PermissionDenied('Você não tem permissão para excluir insumos.')
        return super().destroy(request, *args, **kwargs)

class ReceitaViewSet(viewsets.ModelViewSet):
    queryset = Receita.objects.all().prefetch_related('itens__insumo', 'itens__receita', 'itens')
    serializer_class = ReceitaSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        qs = super().get_queryset()
        restaurante_id = self.request.query_params.get('restaurante')
        if restaurante_id:
            qs = qs.filter(restaurante_id=restaurante_id)
        user = self.request.user
        if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
            return qs.none()
        if is_admin(user):
            return qs
        # Para usuários não-admin, buscar todos os restaurantes que eles têm acesso
        vinculos = UsuarioRestaurantePerfil.objects.filter(usuario=user)
        restaurante_ids = [v.restaurante_id for v in vinculos if v.perfil in ['master', 'redator', 'usuario_comum']]
        if restaurante_ids:
            return qs.filter(restaurante_id__in=restaurante_ids)
        return qs.none()

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        if is_admin(user):
            return obj
        restaurante_id = getattr(obj, 'restaurante_id', None)
        if restaurante_id:
            perfil = get_perfil_usuario_restaurante(user, restaurante_id)
            if perfil in ['master', 'redator', 'usuario_comum']:
                return obj
        from rest_framework import exceptions
        raise exceptions.PermissionDenied('Você não tem permissão para acessar esta receita.')

    def create(self, request, *args, **kwargs):
        user = request.user
        restaurante_id = request.data.get('restaurante')
        if not (is_admin(user) or is_master(user, restaurante_id) or is_redator(user, restaurante_id)):
            raise PermissionDenied('Você não tem permissão para criar receitas.')
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        user = request.user
        partial = kwargs.get('partial', False)
        instance = self.get_object()
        restaurante_id = request.data.get('restaurante') or getattr(instance, 'restaurante_id', None)
        if not (is_admin(user) or is_master(user, restaurante_id) or is_redator(user, restaurante_id)):
            raise PermissionDenied('Você não tem permissão para editar receitas.')
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        restaurante_id = instance.restaurante_id
        if not (is_admin(user) or is_master(user, restaurante_id) or is_redator(user, restaurante_id)):
            raise PermissionDenied('Você não tem permissão para excluir receitas.')
        return super().destroy(request, *args, **kwargs)

class ReceitaInsumoViewSet(viewsets.ModelViewSet):
    queryset = ReceitaInsumo.objects.all()
    serializer_class = ReceitaInsumoSerializer
    permission_classes = [IsAuthenticated]

class FichaTecnicaViewSet(viewsets.ModelViewSet):
    queryset = FichaTecnica.objects.all()
    serializer_class = FichaTecnicaSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        qs = super().get_queryset()
        restaurante_id = self.request.query_params.get('restaurante')
        if restaurante_id:
            qs = qs.filter(restaurante_id=restaurante_id)
        user = self.request.user
        if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
            return qs.none()
        if is_admin(user):
            return qs
        # Para usuários não-admin, buscar todos os restaurantes que eles têm acesso
        vinculos = UsuarioRestaurantePerfil.objects.filter(usuario=user)
        restaurante_ids = [v.restaurante_id for v in vinculos if v.perfil in ['master', 'redator', 'usuario_comum']]
        if restaurante_ids:
            return qs.filter(restaurante_id__in=restaurante_ids)
        return qs.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        restaurante_id = request.data.get('restaurante')
        if not (is_admin(user) or is_master(user, restaurante_id) or is_redator(user, restaurante_id)):
            raise PermissionDenied('Você não tem permissão para criar fichas técnicas.')
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    def update(self, request, *args, **kwargs):
        user = request.user
        partial = kwargs.get('partial', False)
        instance = self.get_object()
        restaurante_id = request.data.get('restaurante') or getattr(instance, 'restaurante_id', None)
        if not (is_admin(user) or is_master(user, restaurante_id) or is_redator(user, restaurante_id)):
            raise PermissionDenied('Você não tem permissão para editar fichas técnicas.')
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        restaurante_id = instance.restaurante_id
        if not (is_admin(user) or is_master(user, restaurante_id) or is_redator(user, restaurante_id)):
            raise PermissionDenied('Você não tem permissão para excluir fichas técnicas.')
        return super().destroy(request, *args, **kwargs)

class FichaTecnicaItemViewSet(viewsets.ModelViewSet):
    queryset = FichaTecnicaItem.objects.all()
    serializer_class = FichaTecnicaItemSerializer
    permission_classes = [IsAuthenticated]

class MeusPerfisView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        perfis = UsuarioRestaurantePerfil.objects.filter(usuario=request.user)
        serializer = UsuarioRestaurantePerfilSerializer(perfis, many=True)
        return Response(serializer.data)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_active': user.is_active,
            'date_joined': user.date_joined
        })

def get_perfil_usuario_restaurante(user, restaurante_id):
    if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
        return None
    try:
        vinculo = UsuarioRestaurantePerfil.objects.get(usuario=user, restaurante_id=restaurante_id)
        return vinculo.perfil
    except UsuarioRestaurantePerfil.DoesNotExist:
        return None

def is_admin(user):
    return user.is_superuser or user.is_staff

def is_master(user, restaurante_id):
    return get_perfil_usuario_restaurante(user, restaurante_id) == 'master'

def is_redator(user, restaurante_id):
    return get_perfil_usuario_restaurante(user, restaurante_id) == 'redator'

def is_usuario_comum(user, restaurante_id):
    return get_perfil_usuario_restaurante(user, restaurante_id) == 'usuario_comum'

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

class UserCreateView(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=201)
        return Response(serializer.errors, status=400)

class RegistroAtividadeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RegistroAtividadeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = RegistroAtividade.objects.all().order_by('-data_hora')
        
        # Filtros
        tipo = self.request.query_params.get('tipo', None)
        acao = self.request.query_params.get('acao', None)
        data_inicio = self.request.query_params.get('data_inicio', None)
        data_fim = self.request.query_params.get('data_fim', None)
        
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        if acao:
            queryset = queryset.filter(acao=acao)
        if data_inicio:
            queryset = queryset.filter(data_hora__date__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_hora__date__lte=data_fim)
            
        return queryset

# Função para atualizar registro de atividade com usuário e perfil
def atualizar_registro_atividade(usuario, perfil, tipo, acao, nome, descricao=""):
    """Atualiza o último registro de atividade com informações do usuário"""
    try:
        from .models import RegistroAtividade
        ultimo_registro = RegistroAtividade.objects.filter(
            tipo=tipo,
            acao=acao,
            nome=nome
        ).order_by('-data_hora').first()
        
        if ultimo_registro:
            ultimo_registro.usuario = usuario
            ultimo_registro.perfil = perfil
            ultimo_registro.save()
    except Exception as e:
        print(f"Erro ao atualizar registro de atividade: {e}")
