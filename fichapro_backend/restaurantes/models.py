from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User, Group
from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in
from django.utils import timezone

User = get_user_model()

# Create your models here.

class Restaurante(models.Model):
    nome = models.CharField(max_length=255)
    cnpj = models.CharField(max_length=18, unique=True)
    email = models.EmailField()
    telefone = models.CharField(max_length=20)
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    # Endereço
    cep = models.CharField(max_length=9)
    rua = models.CharField(max_length=255)
    numero = models.CharField(max_length=10)
    complemento = models.CharField(max_length=255, blank=True)
    bairro = models.CharField(max_length=255)
    cidade = models.CharField(max_length=255)
    estado = models.CharField(max_length=2)
    fator_correcao = models.DecimalField(max_digits=5, decimal_places=2, default=1.00)
    def __str__(self):
        return self.nome

class Insumo(models.Model):
    UNIDADES = [
        ("g", "Grama (g)"),
        ("ml", "Mililitro (ml)"),
        ("un", "Unidade (un)"),
    ]
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE, related_name="insumos")
    nome = models.CharField(max_length=255)
    peso = models.DecimalField(max_digits=10, decimal_places=3)
    unidade_medida = models.CharField(max_length=2, choices=UNIDADES)
    preco = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.nome} ({self.restaurante.nome})"

class Receita(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE, related_name="receitas")
    nome = models.CharField(max_length=255)
    tempo_preparo = models.PositiveIntegerField(help_text="Tempo de preparo em minutos")
    porcao_sugerida = models.CharField(max_length=100)
    modo_preparo = models.TextField()
    peso_final = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    custo_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rendimento = models.CharField(max_length=100, null=True, blank=True)
    imagem = models.ImageField(upload_to='receitas/', null=True, blank=True)
    valor_restaurante = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    valor_ifood = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.nome} ({self.restaurante.nome})"

class ReceitaInsumo(models.Model):
    receita = models.ForeignKey(Receita, on_delete=models.CASCADE, related_name="itens")
    insumo = models.ForeignKey(Insumo, on_delete=models.CASCADE, null=True, blank=True)
    receita_sub = models.ForeignKey(Receita, on_delete=models.CASCADE, null=True, blank=True, related_name="usos_como_subreceita")
    quantidade_utilizada = models.DecimalField(max_digits=10, decimal_places=3)
    ic = models.DecimalField("Índice de Cocção (IC)", max_digits=5, decimal_places=2, default=100)
    ipc = models.DecimalField("Índice de Partes Comestíveis (IPC)", max_digits=5, decimal_places=2, default=100)
    aplicar_ic_ipc = models.BooleanField(default=True)

    def __str__(self):
        if self.insumo:
            return f"{self.insumo.nome} na {self.receita.nome}"
        elif self.receita_sub:
            return f"{self.receita_sub.nome} (sub) na {self.receita.nome}"
        return f"Item na {self.receita.nome}"

class FichaTecnica(models.Model):
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE, related_name="fichas_tecnicas")
    nome = models.CharField(max_length=255)
    rendimento = models.CharField(max_length=100)
    modo_preparo = models.TextField()
    peso_final = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    custo_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    imagem = models.ImageField(upload_to='fichas_tecnicas/', null=True, blank=True)
    valor_restaurante = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    valor_ifood = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.nome} ({self.restaurante.nome})"

class FichaTecnicaItem(models.Model):
    ficha = models.ForeignKey(FichaTecnica, on_delete=models.CASCADE, related_name="itens")
    insumo = models.ForeignKey(Insumo, on_delete=models.CASCADE, null=True, blank=True)
    receita = models.ForeignKey(Receita, on_delete=models.CASCADE, null=True, blank=True)
    quantidade_utilizada = models.DecimalField(max_digits=10, decimal_places=3)
    unidade_medida = models.CharField(max_length=2, choices=[("g", "g"), ("ml", "ml"), ("un", "un")], default="g")
    ic = models.DecimalField("Índice de Cocção (IC)", max_digits=5, decimal_places=2, default=100)
    ic_tipo = models.CharField(max_length=10, choices=[("menos", "Menos (perda de peso)"), ("mais", "Mais (ganho de peso)")], default="menos")
    ipc = models.DecimalField("Índice de Partes Comestíveis (IPC)", max_digits=5, decimal_places=2, default=100)
    aplicar_ic_ipc = models.BooleanField(default=True)

    def __str__(self):
        if self.insumo:
            return f"{self.insumo.nome} na ficha {self.ficha.nome}"
        elif self.receita:
            return f"{self.receita.nome} na ficha {self.ficha.nome}"
        return f"Item na ficha {self.ficha.nome}"

@receiver(post_save, sender=ReceitaInsumo)
def atualizar_valores_receita_apos_item(sender, instance, **kwargs):
    """Atualiza custo_total e valores sugeridos da receita quando um item é salvo"""
    receita = instance.receita
    from .serializers import ReceitaSerializer
    serializer = ReceitaSerializer(receita, context={})
    
    # Atualiza custo_total
    custo_total = serializer.get_custo_total(receita)
    if custo_total is not None:
        receita.custo_total = custo_total
        
        # Calcula valores sugeridos
        fator = float(receita.restaurante.fator_correcao) if receita.restaurante.fator_correcao else 1.0
        taxa_ifood = 0.12
        receita.valor_restaurante = round(float(custo_total) * fator, 2)
        receita.valor_ifood = round(float(custo_total) * fator * (1 + taxa_ifood), 2)
        
        receita.save(update_fields=["custo_total", "valor_restaurante", "valor_ifood"])

@receiver(post_delete, sender=ReceitaInsumo)
def atualizar_valores_receita_apos_item_deletado(sender, instance, **kwargs):
    """Atualiza custo_total e valores sugeridos da receita quando um item é deletado"""
    receita = instance.receita
    from .serializers import ReceitaSerializer
    serializer = ReceitaSerializer(receita, context={})
    
    # Atualiza custo_total
    custo_total = serializer.get_custo_total(receita)
    if custo_total is not None:
        receita.custo_total = custo_total
        
        # Calcula valores sugeridos
        fator = float(receita.restaurante.fator_correcao) if receita.restaurante.fator_correcao else 1.0
        taxa_ifood = 0.12
        receita.valor_restaurante = round(float(custo_total) * fator, 2)
        receita.valor_ifood = round(float(custo_total) * fator * (1 + taxa_ifood), 2)
        
        receita.save(update_fields=["custo_total", "valor_restaurante", "valor_ifood"])

@receiver(post_save, sender=FichaTecnicaItem)
def atualizar_ficha_tecnica_apos_item(sender, instance, **kwargs):
    ficha = instance.ficha
    from .serializers import FichaTecnicaSerializer
    serializer = FichaTecnicaSerializer(ficha, context={})
    
    # Atualiza custo_total e peso_final
    custo_total = serializer.get_custo_total(ficha)
    peso_final = serializer.get_peso_final(ficha)
    
    if custo_total is not None:
        ficha.custo_total = custo_total
        
        # Calcula valores sugeridos
        fator = float(ficha.restaurante.fator_correcao) if ficha.restaurante.fator_correcao else 1.0
        taxa_ifood = 0.12
        ficha.valor_restaurante = round(float(custo_total) * fator, 2)
        ficha.valor_ifood = round(float(custo_total) * fator * (1 + taxa_ifood), 2)
    
    if peso_final is not None:
        ficha.peso_final = peso_final
    
    ficha.save(update_fields=["custo_total", "peso_final", "valor_restaurante", "valor_ifood"])

@receiver(post_delete, sender=FichaTecnicaItem)
def atualizar_ficha_tecnica_apos_item_deletado(sender, instance, **kwargs):
    """Atualiza custo_total e valores sugeridos da ficha quando um item é deletado"""
    ficha = instance.ficha
    from .serializers import FichaTecnicaSerializer
    serializer = FichaTecnicaSerializer(ficha, context={})
    
    # Atualiza custo_total e peso_final
    custo_total = serializer.get_custo_total(ficha)
    peso_final = serializer.get_peso_final(ficha)
    
    if custo_total is not None:
        ficha.custo_total = custo_total
        
        # Calcula valores sugeridos
        fator = float(ficha.restaurante.fator_correcao) if ficha.restaurante.fator_correcao else 1.0
        taxa_ifood = 0.12
        ficha.valor_restaurante = round(float(custo_total) * fator, 2)
        ficha.valor_ifood = round(float(custo_total) * fator * (1 + taxa_ifood), 2)
    
    if peso_final is not None:
        ficha.peso_final = peso_final
    
    ficha.save(update_fields=["custo_total", "peso_final", "valor_restaurante", "valor_ifood"])

PERFIS = (
    ("administrador", "Administrador"),
    ("master", "Master"),
    ("redator", "Redator"),
    ("usuario_comum", "Usuário Comum"),
)

class UsuarioRestaurantePerfil(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="vinculos")
    restaurante = models.ForeignKey(Restaurante, on_delete=models.CASCADE, related_name="usuarios")
    perfil = models.CharField(max_length=20, choices=PERFIS)

    class Meta:
        unique_together = ("usuario", "restaurante")

    def __str__(self):
        return f"{self.usuario.username} - {self.restaurante.nome} ({self.get_perfil_display()})"

class RegistroAtividade(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    perfil = models.CharField(max_length=50)
    tipo = models.CharField(max_length=50)  # insumo, receita, ficha_tecnica, usuario, restaurante
    acao = models.CharField(max_length=20)  # criado, editado, excluido
    nome = models.CharField(max_length=255)
    descricao = models.TextField(blank=True)
    data_hora = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo} {self.acao} por {self.usuario} em {self.data_hora}"

# Signals para registrar atividades
def registrar_atividade(usuario, perfil, tipo, acao, nome, descricao=""):
    """Função auxiliar para registrar atividades"""
    try:
        RegistroAtividade.objects.create(
            usuario=usuario,
            perfil=perfil,
            tipo=tipo,
            acao=acao,
            nome=nome,
            descricao=descricao
        )
    except Exception as e:
        print(f"Erro ao registrar atividade: {e}")

# Signal para Restaurante
@receiver(post_save, sender=Restaurante)
def registrar_restaurante(sender, instance, created, **kwargs):
    if created:
        registrar_atividade(
            usuario=None,  # Será preenchido na view
            perfil="",     # Será preenchido na view
            tipo="restaurante",
            acao="criado",
            nome=instance.nome,
            descricao=f"Restaurante {instance.nome} criado"
        )
    else:
        registrar_atividade(
            usuario=None,
            perfil="",
            tipo="restaurante",
            acao="editado",
            nome=instance.nome,
            descricao=f"Restaurante {instance.nome} editado"
        )

@receiver(post_delete, sender=Restaurante)
def registrar_restaurante_excluido(sender, instance, **kwargs):
    registrar_atividade(
        usuario=None,
        perfil="",
        tipo="restaurante",
        acao="excluido",
        nome=instance.nome,
        descricao=f"Restaurante {instance.nome} excluído"
    )

# Signal para Insumo
@receiver(post_save, sender=Insumo)
def registrar_insumo(sender, instance, created, **kwargs):
    if created:
        registrar_atividade(
            usuario=None,
            perfil="",
            tipo="insumo",
            acao="criado",
            nome=instance.nome,
            descricao=f"Insumo {instance.nome} criado no restaurante {instance.restaurante.nome}"
        )
    else:
        registrar_atividade(
            usuario=None,
            perfil="",
            tipo="insumo",
            acao="editado",
            nome=instance.nome,
            descricao=f"Insumo {instance.nome} editado no restaurante {instance.restaurante.nome}"
        )

@receiver(post_delete, sender=Insumo)
def registrar_insumo_excluido(sender, instance, **kwargs):
    registrar_atividade(
        usuario=None,
        perfil="",
        tipo="insumo",
        acao="excluido",
        nome=instance.nome,
        descricao=f"Insumo {instance.nome} excluído do restaurante {instance.restaurante.nome}"
    )

# Signal para Receita
@receiver(post_save, sender=Receita)
def registrar_receita(sender, instance, created, **kwargs):
    if created:
        registrar_atividade(
            usuario=None,
            perfil="",
            tipo="receita",
            acao="criado",
            nome=instance.nome,
            descricao=f"Receita {instance.nome} criada no restaurante {instance.restaurante.nome}"
        )
    else:
        registrar_atividade(
            usuario=None,
            perfil="",
            tipo="receita",
            acao="editado",
            nome=instance.nome,
            descricao=f"Receita {instance.nome} editada no restaurante {instance.restaurante.nome}"
        )

@receiver(post_delete, sender=Receita)
def registrar_receita_excluida(sender, instance, **kwargs):
    registrar_atividade(
        usuario=None,
        perfil="",
        tipo="receita",
        acao="excluido",
        nome=instance.nome,
        descricao=f"Receita {instance.nome} excluída do restaurante {instance.restaurante.nome}"
    )

@receiver(post_save, sender=Receita)
def atualizar_valores_sugeridos_receita(sender, instance, **kwargs):
    # Atualiza valor_restaurante e valor_ifood automaticamente
    if instance.custo_total is not None:
        fator = float(instance.restaurante.fator_correcao) if instance.restaurante.fator_correcao else 1.0
        taxa_ifood = 0.12
        instance.valor_restaurante = round(float(instance.custo_total) * fator, 2)
        instance.valor_ifood = round(float(instance.custo_total) * fator * (1 + taxa_ifood), 2)
        instance.save(update_fields=["valor_restaurante", "valor_ifood"])

# Signal para FichaTecnica
@receiver(post_save, sender=FichaTecnica)
def registrar_ficha_tecnica(sender, instance, created, **kwargs):
    if created:
        registrar_atividade(
            usuario=None,
            perfil="",
            tipo="ficha_tecnica",
            acao="criado",
            nome=instance.nome,
            descricao=f"Ficha técnica {instance.nome} criada no restaurante {instance.restaurante.nome}"
        )
    else:
        registrar_atividade(
            usuario=None,
            perfil="",
            tipo="ficha_tecnica",
            acao="editado",
            nome=instance.nome,
            descricao=f"Ficha técnica {instance.nome} editada no restaurante {instance.restaurante.nome}"
        )

@receiver(post_delete, sender=FichaTecnica)
def registrar_ficha_tecnica_excluida(sender, instance, **kwargs):
    registrar_atividade(
        usuario=None,
        perfil="",
        tipo="ficha_tecnica",
        acao="excluido",
        nome=instance.nome,
        descricao=f"Ficha técnica {instance.nome} excluída do restaurante {instance.restaurante.nome}"
    )

@receiver(post_save, sender=FichaTecnica)
def atualizar_valores_sugeridos_ficha(sender, instance, **kwargs):
    # Atualiza valor_restaurante e valor_ifood automaticamente
    if instance.custo_total is not None:
        fator = float(instance.restaurante.fator_correcao) if instance.restaurante.fator_correcao else 1.0
        taxa_ifood = 0.12
        instance.valor_restaurante = round(float(instance.custo_total) * fator, 2)
        instance.valor_ifood = round(float(instance.custo_total) * fator * (1 + taxa_ifood), 2)
        instance.save(update_fields=["valor_restaurante", "valor_ifood"])

# Signal para UsuarioRestaurantePerfil
@receiver(post_save, sender=UsuarioRestaurantePerfil)
def registrar_usuario_restaurante(sender, instance, created, **kwargs):
    if created:
        registrar_atividade(
            usuario=None,
            perfil="",
            tipo="usuario",
            acao="criado",
            nome=instance.usuario.username,
            descricao=f"Usuário {instance.usuario.username} vinculado ao restaurante {instance.restaurante.nome} como {instance.get_perfil_display()}"
        )
    else:
        registrar_atividade(
            usuario=None,
            perfil="",
            tipo="usuario",
            acao="editado",
            nome=instance.usuario.username,
            descricao=f"Perfil do usuário {instance.usuario.username} editado no restaurante {instance.restaurante.nome}"
        )

@receiver(post_delete, sender=UsuarioRestaurantePerfil)
def registrar_usuario_restaurante_excluido(sender, instance, **kwargs):
    registrar_atividade(
        usuario=None,
        perfil="",
        tipo="usuario",
        acao="excluido",
        nome=instance.usuario.username,
        descricao=f"Usuário {instance.usuario.username} desvinculado do restaurante {instance.restaurante.nome}"
    )
