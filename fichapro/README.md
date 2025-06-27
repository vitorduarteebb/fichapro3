# FichaPro

Sistema de Gestão para Restaurantes

---

Este projeto visa criar uma plataforma moderna e intuitiva para auxiliar restaurantes no controle de insumos, receitas, fichas técnicas e usuários, com diferentes níveis de acesso e segurança.

## Tecnologias
- **Frontend:** React.js + Vite + TailwindCSS + Lucide Icons
- **Backend:** Django REST Framework
- **Banco de Dados:** SQLite (para desenvolvimento)

## Estrutura do Projeto

```
fichapro/
├─ src/
│  ├─ components/
│  │  └─ Sidebar.jsx
│  │  ├─ pages/
│  │  │  ├─ Dashboard.jsx
│  │  │  ├─ Restaurantes.jsx
│  │  │  ├─ CriarNovo.jsx
│  │  │  └─ Usuarios.jsx
│  │  ├─ routes/
│  │  │  └─ AppRoutes.jsx
│  │  ├─ App.jsx
│  │  ├─ main.jsx
│  │  └─ index.css
│  ├─ public/
│  ├─ package.json
│  ├─ tailwind.config.js
│  ├─ postcss.config.js
│  └─ README.md
```

## Como rodar o projeto

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Rode o projeto:
   ```bash
   npm run dev
   ```

## Objetivo do Sistema
O sistema permite o controle de múltiplos restaurantes, cadastro de insumos, criação de receitas com valores calculados automaticamente, além de controle de usuários com permissões específicas.

---

Este é apenas o início do FichaPro. Novos componentes e funcionalidades serão adicionados conforme a evolução do projeto.
