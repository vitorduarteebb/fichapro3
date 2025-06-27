# FichaPro

Sistema de gerenciamento de fichas técnicas para restaurantes.

## Descrição

O FichaPro é uma aplicação web completa para gerenciamento de fichas técnicas de restaurantes, permitindo controle de insumos, receitas e custos.

## Estrutura do Projeto

- `fichapro/` - Frontend React
- `fichapro_backend/` - Backend Django

## Tecnologias Utilizadas

### Frontend
- React
- Vite
- Tailwind CSS
- React Router

### Backend
- Django
- Django REST Framework
- SQLite

## Instalação e Configuração

### Frontend
```bash
cd fichapro
npm install
npm run dev
```

### Backend
```bash
cd fichapro_backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Funcionalidades

- Gerenciamento de restaurantes
- Controle de insumos
- Criação e edição de receitas
- Fichas técnicas
- Controle de usuários e permissões
- Registros de atividade

## Desenvolvimento

Para iniciar o sistema completo, execute o arquivo `iniciar_sistema.bat` na raiz do projeto. 