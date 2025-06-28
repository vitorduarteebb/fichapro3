from django.contrib import admin
from .models import Restaurante, Insumo, Receita, ReceitaInsumo, FichaTecnica, FichaTecnicaItem, UsuarioRestaurantePerfil, CategoriaInsumo, HistoricoPrecoInsumo

admin.site.register(Restaurante)
admin.site.register(Insumo)
admin.site.register(Receita)
admin.site.register(ReceitaInsumo)
admin.site.register(FichaTecnica)
admin.site.register(FichaTecnicaItem)
admin.site.register(UsuarioRestaurantePerfil)
admin.site.register(CategoriaInsumo)
admin.site.register(HistoricoPrecoInsumo)
