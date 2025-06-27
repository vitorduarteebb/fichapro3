import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fichapro_backend.settings')
django.setup()

from restaurantes.models import Receita, FichaTecnica

print("Forçando atualização dos valores sugeridos...")

# Atualizar receitas
for receita in Receita.objects.all():
    if receita.custo_total:
        fator = float(receita.restaurante.fator_correcao) if receita.restaurante.fator_correcao else 1.0
        taxa_ifood = 0.12
        receita.valor_restaurante = round(float(receita.custo_total) * fator, 2)
        receita.valor_ifood = round(float(receita.custo_total) * fator * (1 + taxa_ifood), 2)
        receita.save(update_fields=["valor_restaurante", "valor_ifood"])
        print(f"Receita {receita.nome}: R$ {receita.valor_restaurante} / R$ {receita.valor_ifood}")

# Atualizar fichas técnicas
for ficha in FichaTecnica.objects.all():
    if ficha.custo_total:
        fator = float(ficha.restaurante.fator_correcao) if ficha.restaurante.fator_correcao else 1.0
        taxa_ifood = 0.12
        ficha.valor_restaurante = round(float(ficha.custo_total) * fator, 2)
        ficha.valor_ifood = round(float(ficha.custo_total) * fator * (1 + taxa_ifood), 2)
        ficha.save(update_fields=["valor_restaurante", "valor_ifood"])
        print(f"Ficha {ficha.nome}: R$ {ficha.valor_restaurante} / R$ {ficha.valor_ifood}")

print("Atualização concluída!") 