#!/usr/bin/env python
"""
Script para verificar e forçar atualização dos valores sugeridos
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fichapro_backend.settings')
django.setup()

from restaurantes.models import Receita, FichaTecnica
from restaurantes.serializers import ReceitaSerializer, FichaTecnicaSerializer

def verificar_e_atualizar_valores():
    """Verifica e força atualização dos valores sugeridos"""
    
    print("=== VERIFICANDO RECEITAS ===")
    receitas = Receita.objects.all()
    
    for receita in receitas:
        print(f"\nReceita: {receita.nome}")
        print(f"  Custo total: R$ {receita.custo_total}")
        print(f"  Fator correção: {receita.restaurante.fator_correcao}")
        print(f"  Valor restaurante atual: R$ {receita.valor_restaurante}")
        print(f"  Valor iFood atual: R$ {receita.valor_ifood}")
        
        # Calcular valores corretos
        if receita.custo_total is not None:
            fator = float(receita.restaurante.fator_correcao) if receita.restaurante.fator_correcao else 1.0
            taxa_ifood = 0.12
            
            valor_restaurante_correto = round(float(receita.custo_total) * fator, 2)
            valor_ifood_correto = round(float(receita.custo_total) * fator * (1 + taxa_ifood), 2)
            
            print(f"  Valor restaurante correto: R$ {valor_restaurante_correto}")
            print(f"  Valor iFood correto: R$ {valor_ifood_correto}")
            
            # Atualizar se necessário
            if (receita.valor_restaurante != valor_restaurante_correto or 
                receita.valor_ifood != valor_ifood_correto):
                receita.valor_restaurante = valor_restaurante_correto
                receita.valor_ifood = valor_ifood_correto
                receita.save(update_fields=["valor_restaurante", "valor_ifood"])
                print("  ✅ ATUALIZADO!")
            else:
                print("  ✅ Já está correto!")
    
    print("\n=== VERIFICANDO FICHAS TÉCNICAS ===")
    fichas = FichaTecnica.objects.all()
    
    for ficha in fichas:
        print(f"\nFicha: {ficha.nome}")
        print(f"  Custo total: R$ {ficha.custo_total}")
        print(f"  Fator correção: {ficha.restaurante.fator_correcao}")
        print(f"  Valor restaurante atual: R$ {ficha.valor_restaurante}")
        print(f"  Valor iFood atual: R$ {ficha.valor_ifood}")
        
        # Calcular valores corretos
        if ficha.custo_total is not None:
            fator = float(ficha.restaurante.fator_correcao) if ficha.restaurante.fator_correcao else 1.0
            taxa_ifood = 0.12
            
            valor_restaurante_correto = round(float(ficha.custo_total) * fator, 2)
            valor_ifood_correto = round(float(ficha.custo_total) * fator * (1 + taxa_ifood), 2)
            
            print(f"  Valor restaurante correto: R$ {valor_restaurante_correto}")
            print(f"  Valor iFood correto: R$ {valor_ifood_correto}")
            
            # Atualizar se necessário
            if (ficha.valor_restaurante != valor_restaurante_correto or 
                ficha.valor_ifood != valor_ifood_correto):
                ficha.valor_restaurante = valor_restaurante_correto
                ficha.valor_ifood = valor_ifood_correto
                ficha.save(update_fields=["valor_restaurante", "valor_ifood"])
                print("  ✅ ATUALIZADO!")
            else:
                print("  ✅ Já está correto!")

if __name__ == "__main__":
    verificar_e_atualizar_valores() 