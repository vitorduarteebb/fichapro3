from django.shortcuts import render
from rest_framework import viewsets
from .models import Restaurante, Insumo, Receita, ReceitaInsumo, FichaTecnica, FichaTecnicaItem, UsuarioRestaurantePerfil, RegistroAtividade, CategoriaInsumo
from .serializers import RestauranteSerializer, InsumoSerializer, ReceitaSerializer, ReceitaInsumoSerializer, FichaTecnicaSerializer, FichaTecnicaItemSerializer, UsuarioRestaurantePerfilSerializer, UserSerializer, UserCreateSerializer, UserUpdateSerializer, RegistroAtividadeSerializer, CategoriaInsumoSerializer, HistoricoPrecoInsumoSerializer
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.models import User
from rest_framework.decorators import action, api_view, permission_classes
from django.db import transaction
from rest_framework import permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import update_last_login
from django.db.models import Count, Sum, F, Q

# Custom JWT login que atualiza o last_login
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        update_last_login(None, user)
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

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
        if is_admin(usuario):
            return "administrador"
        try:
            vinculo = UsuarioRestaurantePerfil.objects.get(usuario=usuario, restaurante=restaurante)
            return vinculo.perfil
        except UsuarioRestaurantePerfil.DoesNotExist:
            return None

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

    @action(detail=True, methods=['get'])
    def historico_preco(self, request, pk=None):
        insumo = self.get_object()
        historico = insumo.historico_precos.order_by('data')
        serializer = HistoricoPrecoInsumoSerializer(historico, many=True)
        return Response(serializer.data)

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
        raise exceptions.PermissionDenied('Você não tem permissão para acessar esta ficha técnica.')

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

    def get_queryset(self):
        qs = super().get_queryset()
        ficha_id = self.request.query_params.get('ficha')
        if ficha_id:
            qs = qs.filter(ficha_id=ficha_id)
        
        user = self.request.user
        if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
            return qs.none()
        
        # Administradores podem ver todos os itens
        if is_admin(user):
            return qs
        
        # Para usuários não-admin, filtrar por restaurantes que eles têm acesso
        vinculos = UsuarioRestaurantePerfil.objects.filter(usuario=user)
        restaurante_ids = [v.restaurante_id for v in vinculos if v.perfil in ['master', 'redator', 'usuario_comum']]
        if restaurante_ids:
            return qs.filter(ficha__restaurante_id__in=restaurante_ids)
        
        return qs.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        ficha_id = request.data.get('ficha')
        
        if ficha_id:
            try:
                ficha = FichaTecnica.objects.get(id=ficha_id)
                restaurante_id = ficha.restaurante_id
                if not (is_admin(user) or is_master(user, restaurante_id) or is_redator(user, restaurante_id)):
                    raise PermissionDenied('Você não tem permissão para criar itens de ficha técnica.')
            except FichaTecnica.DoesNotExist:
                raise PermissionDenied('Ficha técnica não encontrada.')
        
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        ficha = instance.ficha
        restaurante_id = ficha.restaurante_id
        
        if not (is_admin(user) or is_master(user, restaurante_id) or is_redator(user, restaurante_id)):
            raise PermissionDenied('Você não tem permissão para editar itens de ficha técnica.')
        
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        ficha = instance.ficha
        restaurante_id = ficha.restaurante_id
        
        if not (is_admin(user) or is_master(user, restaurante_id) or is_redator(user, restaurante_id)):
            raise PermissionDenied('Você não tem permissão para excluir itens de ficha técnica.')
        
        return super().destroy(request, *args, **kwargs)

class MeusPerfisView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        
        # Se for administrador, retornar perfil especial sem vínculo com restaurante
        if is_admin(user):
            return Response([{
                'id': 0,
                'usuario': user.id,
                'restaurante': None,
                'restaurante_nome': 'Sistema',
                'perfil': 'administrador',
                'perfil_display': 'Administrador do Sistema'
            }])
        
        # Para usuários não-admin, retornar vínculos normais
        perfis = UsuarioRestaurantePerfil.objects.filter(usuario=user)
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_admin(request):
    # Total de restaurantes
    total_restaurantes = Restaurante.objects.count()

    # Ranking de restaurantes (por número de receitas + fichas técnicas)
    restaurantes = Restaurante.objects.annotate(
        total_registros=Count('receitas', distinct=True) + Count('fichas_tecnicas', distinct=True)
    ).order_by('-total_registros')[:10]
    ranking_restaurantes = [
        {
            'nome': r.nome,
            'registros': r.total_registros
        } for r in restaurantes
    ]

    # Ranking de redatores (por criações/edições)
    redatores = User.objects.filter(
        vinculos__perfil='redator'
    ).distinct()
    ranking_redatores = []
    for user in redatores:
        # Não é possível contar por 'criado_por', então apenas adicionar o usuário ao ranking com 0
        ranking_redatores.append({
            'id': user.id,
            'username': user.username,
            'total_criados': 0
        })

    # Maiores custos (top 5 receitas/fichas técnicas)
    maiores_custos_receitas = Receita.objects.order_by('-custo_total')[:5]
    maiores_custos_fichas = FichaTecnica.objects.order_by('-custo_total')[:5]
    maiores_custos = [
        {'nome': r.nome, 'custo_total': r.custo_total} for r in maiores_custos_receitas
    ] + [
        {'nome': f.nome, 'custo_total': f.custo_total} for f in maiores_custos_fichas
    ]
    maiores_custos = sorted(maiores_custos, key=lambda x: x['custo_total'], reverse=True)[:5]

    return Response({
        'total_restaurantes': total_restaurantes,
        'ranking_restaurantes': ranking_restaurantes,
        'ranking_redatores': ranking_redatores,
        'maiores_custos': maiores_custos
    })

class CategoriaInsumoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaInsumo.objects.all()
    serializer_class = CategoriaInsumoSerializer
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
