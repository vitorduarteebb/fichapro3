from rest_framework import serializers
from .models import Restaurante, Insumo, Receita, ReceitaInsumo, FichaTecnica, FichaTecnicaItem, UsuarioRestaurantePerfil, RegistroAtividade
from django.contrib.auth.models import User

class RestauranteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurante
        fields = '__all__'

class InsumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insumo
        fields = '__all__'

class ReceitaInsumoSerializer(serializers.ModelSerializer):
    insumo_nome = serializers.CharField(source='insumo.nome', read_only=True)
    receita_sub_nome = serializers.CharField(source='receita_sub.nome', read_only=True)
    class Meta:
        model = ReceitaInsumo
        fields = ['id', 'insumo', 'insumo_nome', 'receita_sub', 'receita_sub_nome', 'quantidade_utilizada', 'ic', 'ipc', 'aplicar_ic_ipc', 'receita']

class ReceitaSerializer(serializers.ModelSerializer):
    itens = ReceitaInsumoSerializer(many=True, read_only=True)
    custo_total = serializers.SerializerMethodField()
    peso_final = serializers.SerializerMethodField()
    rendimento = serializers.SerializerMethodField()
    imagem = serializers.SerializerMethodField()

    class Meta:
        model = Receita
        fields = ['id', 'restaurante', 'nome', 'tempo_preparo', 'porcao_sugerida', 'modo_preparo', 'itens', 'peso_final', 'custo_total', 'rendimento', 'imagem', 'valor_restaurante', 'valor_ifood']

    def get_custo_total(self, obj):
        request = self.context.get('request')
        if request:
            user = request.user
            restaurante_id = obj.restaurante_id
            from .views import is_admin, is_master
            if not (is_admin(user) or is_master(user, restaurante_id)):
                return None
        def custo_item(item):
            if item.insumo:
                insumo = item.insumo
                if not insumo.preco or not insumo.peso:
                    return 0
                custo_unit = float(insumo.preco) / float(insumo.peso)
                divisor = (float(item.ipc) / 100) * (float(item.ic) / 100) or 1
                return (custo_unit * float(item.quantidade_utilizada)) / divisor
            elif item.receita_sub:
                sub_serializer = ReceitaSerializer(item.receita_sub, context=self.context)
                return sub_serializer.get_custo_total(item.receita_sub) * float(item.quantidade_utilizada)
            return 0
        return sum([custo_item(item) for item in obj.itens.all()])

    def get_peso_final(self, obj):
        peso_total = 0
        for item in obj.itens.all():
            if item.insumo:
                if item.quantidade_utilizada:
                    ic = float(item.ic) if item.ic else 100
                    ipc = float(item.ipc) if item.ipc else 100
                    peso_total += float(item.quantidade_utilizada) * (ipc / 100) * (ic / 100)
            elif hasattr(item, 'receita_sub') and item.receita_sub:
                if item.quantidade_utilizada:
                    sub_serializer = ReceitaSerializer(item.receita_sub, context=self.context)
                    peso_sub = sub_serializer.get_peso_final(item.receita_sub)
                    if peso_sub is not None:
                        peso_total += peso_sub * float(item.quantidade_utilizada)
        return round(peso_total, 2)

    def get_rendimento(self, obj):
        # Retorna o rendimento da receita se existir, senão calcula baseado no peso final
        if obj.rendimento:
            return obj.rendimento
        peso_final = self.get_peso_final(obj)
        if peso_final and peso_final > 0:
            return f"{peso_final}g"
        return "Não calculado"

    def get_imagem(self, obj):
        if obj.imagem:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.imagem.url)
            return obj.imagem.url
        return None

class FichaTecnicaItemSerializer(serializers.ModelSerializer):
    insumo_nome = serializers.CharField(source='insumo.nome', read_only=True)
    receita_nome = serializers.CharField(source='receita.nome', read_only=True)
    
    class Meta:
        model = FichaTecnicaItem
        fields = ['id', 'ficha', 'insumo', 'insumo_nome', 'receita', 'receita_nome', 'quantidade_utilizada', 'unidade_medida', 'ic', 'ic_tipo', 'ipc', 'aplicar_ic_ipc']

class FichaTecnicaSerializer(serializers.ModelSerializer):
    itens = FichaTecnicaItemSerializer(many=True, read_only=True)
    custo_total = serializers.SerializerMethodField()
    peso_final = serializers.SerializerMethodField()
    imagem = serializers.SerializerMethodField()

    class Meta:
        model = FichaTecnica
        fields = ['id', 'restaurante', 'nome', 'rendimento', 'modo_preparo', 'itens', 'peso_final', 'custo_total', 'imagem', 'valor_restaurante', 'valor_ifood']

    def get_custo_total(self, obj):
        request = self.context.get('request')
        if request:
            user = request.user
            restaurante_id = obj.restaurante_id
            from .views import is_admin, is_master
            if not (is_admin(user) or is_master(user, restaurante_id)):
                return None
        def custo_item(item):
            if item.insumo:
                insumo = item.insumo
                if not insumo.preco or not insumo.peso:
                    return 0
                custo_unit = float(insumo.preco) / float(insumo.peso)
                quantidade = float(item.quantidade_utilizada)
                if hasattr(item, 'aplicar_ic_ipc') and not item.aplicar_ic_ipc:
                    return custo_unit * quantidade
                ic = float(item.ic) if item.ic else 100
                ipc = float(item.ipc) if item.ipc else 100
                if ic == 100 and ipc == 100:
                    return custo_unit * quantidade
                divisor = (ic / 100) * (ipc / 100)
                if divisor == 0:
                    divisor = 1
                quantidade_ajustada = quantidade / divisor
                return custo_unit * quantidade_ajustada
            elif item.receita:
                sub_serializer = ReceitaSerializer(item.receita, context=self.context)
                custo_total_receita = sub_serializer.get_custo_total(item.receita)
                peso_final_receita = sub_serializer.get_peso_final(item.receita)
                if peso_final_receita and peso_final_receita > 0:
                    proporcao = float(item.quantidade_utilizada) / peso_final_receita
                    return custo_total_receita * proporcao
                return custo_total_receita
            return 0
        resultado = round(sum([custo_item(item) for item in obj.itens.all()]), 2)
        return resultado

    def get_peso_final(self, obj):
        peso_total = 0
        for item in obj.itens.all():
            if item.insumo:
                if item.quantidade_utilizada:
                    if hasattr(item, 'aplicar_ic_ipc') and not item.aplicar_ic_ipc:
                        peso_total += float(item.quantidade_utilizada)
                    else:
                        ic = float(item.ic) if item.ic else 100
                        ipc = float(item.ipc) if item.ipc else 100
                        peso_total += float(item.quantidade_utilizada) * (ipc / 100) * (ic / 100)
            elif item.receita:
                if item.quantidade_utilizada:
                    sub_serializer = ReceitaSerializer(item.receita, context=self.context)
                    peso_sub = sub_serializer.get_peso_final(item.receita)
                    peso_total += peso_sub * float(item.quantidade_utilizada)
        return round(peso_total, 2)

    def get_imagem(self, obj):
        if obj.imagem:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.imagem.url)
            return obj.imagem.url
        return None 

class UsuarioRestaurantePerfilSerializer(serializers.ModelSerializer):
    usuario = serializers.CharField(source='usuario.username', read_only=True)
    restaurante_nome = serializers.CharField(source='restaurante.nome', read_only=True)
    class Meta:
        model = UsuarioRestaurantePerfil
        fields = ['id', 'usuario', 'restaurante', 'restaurante_nome', 'perfil'] 

class UserSerializer(serializers.ModelSerializer):
    perfis = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'perfis']
    def get_perfis(self, obj):
        from .models import UsuarioRestaurantePerfil
        vinculos = UsuarioRestaurantePerfil.objects.filter(usuario=obj)
        return [
            {
                'restaurante': v.restaurante.nome,
                'perfil': v.get_perfil_display()
            } for v in vinculos
        ]

class UserCreateSerializer(serializers.ModelSerializer):
    perfil = serializers.ChoiceField(choices=[('administrador','Administrador'),('master','Master'),('redator','Redator'),('usuario_comum','Usuário Comum')])
    restaurante = serializers.ListField(child=serializers.IntegerField(), write_only=True)
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'perfil', 'restaurante']
    def validate_restaurante(self, value):
        from .models import Restaurante
        if not value or (isinstance(value, list) and len(value) == 0):
            raise serializers.ValidationError('O restaurante é obrigatório.')
        if isinstance(value, list):
            for v in value:
                if not Restaurante.objects.filter(id=v).exists():
                    raise serializers.ValidationError(f'Restaurante {v} não encontrado.')
        else:
            if not Restaurante.objects.filter(id=value).exists():
                raise serializers.ValidationError('Restaurante não encontrado.')
        return value
    def create(self, validated_data):
        perfil = validated_data.pop('perfil')
        restaurantes = validated_data.pop('restaurante')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        from .models import UsuarioRestaurantePerfil, Restaurante
        if perfil == 'redator' and isinstance(restaurantes, list):
            for rid in restaurantes:
                restaurante = Restaurante.objects.get(id=rid)
                UsuarioRestaurantePerfil.objects.create(usuario=user, restaurante=restaurante, perfil=perfil)
        else:
            restaurante = Restaurante.objects.get(id=restaurantes if not isinstance(restaurantes, list) else restaurantes[0])
            UsuarioRestaurantePerfil.objects.create(usuario=user, restaurante=restaurante, perfil=perfil)
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    perfil = serializers.ChoiceField(choices=[('administrador','Administrador'),('master','Master'),('redator','Redator'),('usuario_comum','Usuário Comum')], required=False)
    restaurante = serializers.IntegerField(required=False)
    class Meta:
        model = User
        fields = ['email', 'is_active', 'perfil', 'restaurante']
    def update(self, instance, validated_data):
        perfil = validated_data.pop('perfil', None)
        restaurante_id = validated_data.pop('restaurante', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if perfil and restaurante_id:
            from .models import UsuarioRestaurantePerfil, Restaurante
            restaurante = Restaurante.objects.get(id=restaurante_id)
            vinculo, _ = UsuarioRestaurantePerfil.objects.get_or_create(usuario=instance, restaurante=restaurante)
            vinculo.perfil = perfil
            vinculo.save()
        return instance 

class RegistroAtividadeSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True)
    class Meta:
        model = RegistroAtividade
        fields = ['id', 'usuario', 'usuario_nome', 'perfil', 'tipo', 'acao', 'nome', 'descricao', 'data_hora'] 