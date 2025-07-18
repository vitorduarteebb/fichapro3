# Generated by Django 5.0.2 on 2025-05-14 21:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurantes', '0007_fichatecnica_custo_total_fichatecnica_peso_final'),
    ]

    operations = [
        migrations.AddField(
            model_name='fichatecnica',
            name='imagem',
            field=models.ImageField(blank=True, null=True, upload_to='fichas_tecnicas/'),
        ),
        migrations.AddField(
            model_name='receita',
            name='imagem',
            field=models.ImageField(blank=True, null=True, upload_to='receitas/'),
        ),
    ]
