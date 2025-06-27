from django.contrib import admin
from .models import Restaurante, Insumo, Receita, ReceitaInsumo, FichaTecnica, FichaTecnicaItem, UsuarioRestaurantePerfil

admin.site.register(Restaurante)
admin.site.register(Insumo)
admin.site.register(Receita)
admin.site.register(ReceitaInsumo)
admin.site.register(FichaTecnica)
admin.site.register(FichaTecnicaItem)
admin.site.register(UsuarioRestaurantePerfil)
