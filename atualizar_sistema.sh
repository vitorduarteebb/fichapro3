#!/bin/bash

# Script de Atualização do FichaPro
# Para sistemas já instalados

set -e

echo "🔄 Iniciando atualização do FichaPro..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Configurações
PROJECT_DIR="/opt/fichapro"
BACKEND_DIR="$PROJECT_DIR/fichapro_backend"
FRONTEND_DIR="$PROJECT_DIR/fichapro"
VENV_DIR="$PROJECT_DIR/venv"

# Verificar se o projeto existe
if [ ! -d "$PROJECT_DIR" ]; then
    error "Projeto não encontrado em $PROJECT_DIR. Execute primeiro o script de deploy."
fi

log "📁 Diretório do projeto: $PROJECT_DIR"

# 1. Fazer backup do banco de dados
log "💾 Fazendo backup do banco de dados..."
cd $BACKEND_DIR
source $VENV_DIR/bin/activate

BACKUP_FILE="/tmp/fichapro_backup_$(date +%Y%m%d_%H%M%S).sql"
sudo -u postgres pg_dump fichapro_db > $BACKUP_FILE
log "Backup salvo em: $BACKUP_FILE"

# 2. Atualizar código do repositório
log "📥 Atualizando código do repositório..."
cd $PROJECT_DIR

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    warning "Existem mudanças não commitadas no repositório local"
    git stash
    STASHED=true
fi

# Fazer pull das últimas alterações
git pull origin main

# Restaurar mudanças se necessário
if [ "$STASHED" = true ]; then
    git stash pop
fi

# 3. Atualizar dependências do backend
log "📦 Atualizando dependências Python..."
cd $BACKEND_DIR
source $VENV_DIR/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 4. Aplicar migrações
log "🗄️ Aplicando migrações..."
python manage.py migrate

# 5. Coletar arquivos estáticos
log "📁 Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

# 6. Atualizar dependências do frontend
log "📦 Atualizando dependências Node.js..."
cd $FRONTEND_DIR
npm install

# 7. Rebuild do frontend
log "🔨 Fazendo build do frontend..."
npm run build

# 8. Reiniciar serviços
log "🚀 Reiniciando serviços..."
systemctl restart fichapro-backend
systemctl restart nginx

# 9. Verificar status
log "✅ Verificando status dos serviços..."
if systemctl is-active --quiet fichapro-backend; then
    log "✅ Backend está rodando"
else
    error "❌ Backend não está rodando"
fi

if systemctl is-active --quiet nginx; then
    log "✅ Nginx está rodando"
else
    error "❌ Nginx não está rodando"
fi

# 10. Limpar backups antigos (manter apenas os últimos 5)
log "🧹 Limpando backups antigos..."
ls -t /tmp/fichapro_backup_*.sql | tail -n +6 | xargs -r rm

log "🎉 Atualização concluída com sucesso!"
echo ""
echo "📋 Resumo da atualização:"
echo "  ✅ Código atualizado"
echo "  ✅ Dependências atualizadas"
echo "  ✅ Migrações aplicadas"
echo "  ✅ Frontend rebuildado"
echo "  ✅ Serviços reiniciados"
echo "  💾 Backup salvo em: $BACKUP_FILE"
echo ""
echo "🔧 Comandos úteis:"
echo "  Status: systemctl status fichapro-backend"
echo "  Logs: journalctl -u fichapro-backend -f"
echo "  Testar: curl http://localhost/api/"
echo "" 