# Generated by Django 5.2.3 on 2025-06-28 01:50

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurantes', '0013_restaurante_fator_correcao'),
    ]

    operations = [
        migrations.CreateModel(
            name='CategoriaInsumo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100)),
                ('restaurante', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='categorias_insumo', to='restaurantes.restaurante')),
            ],
        ),
        migrations.AddField(
            model_name='insumo',
            name='categoria',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='insumos', to='restaurantes.categoriainsumo'),
        ),
    ]
