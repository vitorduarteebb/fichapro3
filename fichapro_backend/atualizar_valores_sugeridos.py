#!/usr/bin/env python
"""
Script para atualizar valores sugeridos (valor_restaurante e valor_ifood) 
para todas as receitas e fichas técnicas existentes.
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fichapro_backend.settings')
django.setup()

from restaurantes.models import Receita, FichaTecnica

def atualizar_valores_sugeridos():
    """Atualiza valor_restaurante e valor_ifood para todas as receitas e fichas técnicas"""
    
    print("Atualizando valores sugeridos...")
    
    # Taxa do iFood (12%)
    taxa_ifood = 0.12
    
    # Atualizar Receitas
    receitas = Receita.objects.all()
    print(f"Processando {receitas.count()} receitas...")
    
    for receita in receitas:
        if receita.custo_total is not None:
            fator = float(receita.restaurante.fator_correcao) if receita.restaurante.fator_correcao else 1.0
            receita.valor_restaurante = round(float(receita.custo_total) * fator, 2)
            receita.valor_ifood = round(float(receita.custo_total) * fator * (1 + taxa_ifood), 2)
            receita.save(update_fields=["valor_restaurante", "valor_ifood"])
            print(f"  Receita '{receita.nome}': R$ {receita.valor_restaurante} / R$ {receita.valor_ifood}")
    
    # Atualizar Fichas Técnicas
    fichas = FichaTecnica.objects.all()
    print(f"Processando {fichas.count()} fichas técnicas...")
    
    for ficha in fichas:
        if ficha.custo_total is not None:
            fator = float(ficha.restaurante.fator_correcao) if ficha.restaurante.fator_correcao else 1.0
            ficha.valor_restaurante = round(float(ficha.custo_total) * fator, 2)
            ficha.valor_ifood = round(float(ficha.custo_total) * fator * (1 + taxa_ifood), 2)
            ficha.save(update_fields=["valor_restaurante", "valor_ifood"])
            print(f"  Ficha '{ficha.nome}': R$ {ficha.valor_restaurante} / R$ {ficha.valor_ifood}")
    
    print("Atualização concluída!")

if __name__ == "__main__":
    atualizar_valores_sugeridos() 