#!/bin/bash

# Script de Deploy Completo do FichaPro
# Para Ubuntu 24.04 LTS ou similar

set -e  # Para o script se houver erro

echo "🚀 Iniciando deploy do FichaPro..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERRO] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root (sudo)"
fi

# Configurações
PROJECT_NAME="fichapro"
PROJECT_DIR="/opt/$PROJECT_NAME"
BACKEND_DIR="$PROJECT_DIR/fichapro_backend"
FRONTEND_DIR="$PROJECT_DIR/fichapro"
VENV_DIR="$PROJECT_DIR/venv"
DB_NAME="fichapro_db"
DB_USER="fichapro_user"
DB_PASSWORD="FichaPro2024!"
GITHUB_REPO="https://github.com/vitorduarteebb/fichapro3.git"

log "Configurações definidas:"
log "  Projeto: $PROJECT_NAME"
log "  Diretório: $PROJECT_DIR"
log "  Repositório: $GITHUB_REPO"

# 1. Atualizar sistema
log "📦 Atualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar dependências do sistema
log "🔧 Instalando dependências do sistema..."
apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    nodejs \
    npm \
    nginx \
    postgresql \
    postgresql-contrib \
    git \
    curl \
    wget \
    unzip \
    build-essential \
    libpq-dev \
    supervisor \
    certbot \
    python3-certbot-nginx

# 3. Configurar PostgreSQL
log "🐘 Configurando PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Criar usuário e banco de dados
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
ALTER ROLE $DB_USER SET client_encoding TO 'utf8';
ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';
ALTER ROLE $DB_USER SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

# 4. Criar diretório do projeto
log "📁 Criando estrutura de diretórios..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 5. Clonar repositório
log "📥 Clonando repositório..."
if [ -d ".git" ]; then
    log "Repositório já existe, atualizando..."
    git pull origin main
else
    git clone $GITHUB_REPO .
fi

# 6. Configurar ambiente Python
log "🐍 Configurando ambiente Python..."
python3 -m venv $VENV_DIR
source $VENV_DIR/bin/activate

# Instalar dependências Python
log "📦 Instalando dependências Python..."
cd $BACKEND_DIR
pip install --upgrade pip
pip install -r requirements.txt

# 7. Configurar Django
log "⚙️ Configurando Django..."
cd $BACKEND_DIR

# Criar arquivo de configuração local
cat > $BACKEND_DIR/fichapro_backend/local_settings.py << EOF
import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-your-secret-key-here-change-this-in-production'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ['*']  # Configure adequadamente para produção

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': '$DB_NAME',
        'USER': '$DB_USER',
        'PASSWORD': '$DB_PASSWORD',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CORS_ALLOW_CREDENTIALS = True
EOF

# Aplicar migrações
log "🗄️ Aplicando migrações..."
python manage.py migrate

# Criar superusuário
log "👤 Criando superusuário..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@fichapro.com', 'admin123') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell

# Coletar arquivos estáticos
log "📁 Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

# 8. Configurar Frontend
log "⚛️ Configurando Frontend..."
cd $FRONTEND_DIR

# Instalar dependências Node.js
log "📦 Instalando dependências Node.js..."
npm install

# Build do frontend
log "🔨 Fazendo build do frontend..."
npm run build

# 9. Configurar Gunicorn
log "🦄 Configurando Gunicorn..."
cat > /etc/systemd/system/fichapro-backend.service << EOF
[Unit]
Description=FichaPro Backend
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=$BACKEND_DIR
Environment=PATH=$VENV_DIR/bin
ExecStart=$VENV_DIR/bin/gunicorn --workers 3 --bind unix:$BACKEND_DIR/fichapro.sock fichapro_backend.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 10. Configurar Nginx
log "🌐 Configurando Nginx..."
cat > /etc/nginx/sites-available/fichapro << EOF
server {
    listen 80;
    server_name _;  # Configure seu domínio aqui

    # Frontend
    location / {
        root $FRONTEND_DIR/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://unix:$BACKEND_DIR/fichapro.sock;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Admin Django
    location /admin/ {
        proxy_pass http://unix:$BACKEND_DIR/fichapro.sock;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files
    location /static/ {
        alias $BACKEND_DIR/staticfiles/;
    }

    # Media files
    location /media/ {
        alias $BACKEND_DIR/media/;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/fichapro /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 11. Configurar permissões
log "🔐 Configurando permissões..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# 12. Iniciar serviços
log "🚀 Iniciando serviços..."
systemctl daemon-reload
systemctl enable fichapro-backend
systemctl start fichapro-backend
systemctl restart nginx

# 13. Configurar firewall
log "🔥 Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 14. Verificar status
log "✅ Verificando status dos serviços..."
systemctl status fichapro-backend --no-pager
systemctl status nginx --no-pager

# 15. Informações finais
log "🎉 Deploy concluído com sucesso!"
echo ""
echo "📋 Informações do sistema:"
echo "  🌐 URL: http://$(curl -s ifconfig.me)"
echo "  👤 Admin: admin"
echo "  🔑 Senha: admin123"
echo "  📁 Projeto: $PROJECT_DIR"
echo ""
echo "🔧 Comandos úteis:"
echo "  Status: systemctl status fichapro-backend"
echo "  Logs: journalctl -u fichapro-backend -f"
echo "  Reiniciar: systemctl restart fichapro-backend"
echo "  Nginx: systemctl restart nginx"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  - Altere a senha do admin após o primeiro login"
echo "  - Configure SSL/HTTPS com Certbot"
echo "  - Configure o domínio no Nginx"
echo "  - Faça backup regular do banco de dados"
echo ""

log "Deploy finalizado! 🚀" 