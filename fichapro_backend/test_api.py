#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fichapro_backend.settings')
django.setup()

from django.contrib.auth.models import User
from restaurantes.models import Receita, Restaurante, UsuarioRestaurantePerfil
from restaurantes.views import ReceitaViewSet
from rest_framework.test import APIRequestFactory
from rest_framework.test import force_authenticate
from django.contrib.auth.middleware import AuthenticationMiddleware
from django.contrib.sessions.middleware import SessionMiddleware

def test_receita_api():
    print("=== TESTE DA API DE RECEITAS ===")
    
    # Verificar dados existentes
    receitas = Receita.objects.all()
    usuarios = User.objects.all()
    restaurantes = Restaurante.objects.all()
    
    print(f"Receitas no banco: {receitas.count()}")
    print(f"Usuários no banco: {usuarios.count()}")
    print(f"Restaurantes no banco: {restaurantes.count()}")
    
    if receitas.count() == 0:
        print("❌ Nenhuma receita encontrada no banco!")
        return
    
    # Pegar primeira receita
    receita = receitas.first()
    print(f"\nReceita de teste: ID={receita.id}, Nome='{receita.nome}', Restaurante='{receita.restaurante.nome}'")
    
    # Verificar vínculos de usuários
    vinculos = UsuarioRestaurantePerfil.objects.all()
    print(f"Vínculos usuário-restaurante: {vinculos.count()}")
    
    for vinculo in vinculos:
        print(f"  - {vinculo.usuario.username} -> {vinculo.restaurante.nome} ({vinculo.perfil})")
    
    # Testar ViewSet
    factory = APIRequestFactory()
    
    # Teste 1: Usuário admin
    admin_user = User.objects.filter(is_superuser=True).first()
    if admin_user:
        print(f"\n--- Teste com usuário admin: {admin_user.username} ---")
        
        # Teste listagem
        request = factory.get('/api/receitas/')
        force_authenticate(request, user=admin_user)
        viewset = ReceitaViewSet()
        viewset.request = request
        queryset = viewset.get_queryset()
        print(f"Receitas visíveis para admin: {queryset.count()}")
        
        # Teste detalhe
        request = factory.get(f'/api/receitas/{receita.id}/')
        force_authenticate(request, user=admin_user)
        viewset = ReceitaViewSet()
        viewset.request = request
        try:
            obj = viewset.get_object()
            print(f"✅ Admin consegue acessar receita {obj.id}: {obj.nome}")
        except Exception as e:
            print(f"❌ Admin não consegue acessar receita: {e}")
    
    # Teste 2: Usuário comum
    user_comum = User.objects.filter(is_superuser=False).first()
    if user_comum:
        print(f"\n--- Teste com usuário comum: {user_comum.username} ---")
        
        # Verificar vínculo
        vinculo = UsuarioRestaurantePerfil.objects.filter(usuario=user_comum).first()
        if vinculo:
            print(f"Vínculo: {vinculo.restaurante.nome} ({vinculo.perfil})")
            
            # Teste listagem
            request = factory.get('/api/receitas/')
            force_authenticate(request, user=user_comum)
            viewset = ReceitaViewSet()
            viewset.request = request
            queryset = viewset.get_queryset()
            print(f"Receitas visíveis para usuário comum: {queryset.count()}")
            
            # Teste detalhe se a receita é do mesmo restaurante
            if receita.restaurante == vinculo.restaurante:
                request = factory.get(f'/api/receitas/{receita.id}/')
                force_authenticate(request, user=user_comum)
                viewset = ReceitaViewSet()
                viewset.request = request
                try:
                    obj = viewset.get_object()
                    print(f"✅ Usuário comum consegue acessar receita {obj.id}: {obj.nome}")
                except Exception as e:
                    print(f"❌ Usuário comum não consegue acessar receita: {e}")
            else:
                print(f"⚠️ Receita não é do mesmo restaurante do usuário")
        else:
            print("⚠️ Usuário comum não tem vínculo com restaurante")
    
    print("\n=== FIM DO TESTE ===")

if __name__ == '__main__':
    test_receita_api() 