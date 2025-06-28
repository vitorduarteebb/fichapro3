# 🚀 Deploy e Atualização do FichaPro

Este documento contém instruções completas para deploy e atualização do sistema FichaPro em servidores Linux.

## 📋 Pré-requisitos

- Ubuntu 24.04 LTS ou similar
- Acesso root (sudo)
- Conexão com internet
- Mínimo 2GB RAM
- 10GB espaço em disco

## 🛠️ Instalação Inicial

### 1. Conectar ao servidor
```bash
ssh root@seu-servidor.com
```

### 2. Baixar e executar o script de deploy
```bash
# Baixar o script
wget https://raw.githubusercontent.com/vitorduarteebb/fichapro3/main/deploy_servidor.sh

# Dar permissão de execução
chmod +x deploy_servidor.sh

# Executar o deploy
./deploy_servidor.sh
```

### 3. Aguardar a conclusão
O script irá:
- ✅ Atualizar o sistema
- ✅ Instalar todas as dependências
- ✅ Configurar PostgreSQL
- ✅ Clonar o repositório
- ✅ Configurar ambiente Python
- ✅ Configurar Django
- ✅ Configurar Frontend
- ✅ Configurar Gunicorn e Nginx
- ✅ Configurar firewall
- ✅ Iniciar todos os serviços

## 🔄 Atualizações

### Atualização Automática
```bash
# Baixar o script de atualização
wget https://raw.githubusercontent.com/vitorduarteebb/fichapro3/main/atualizar_sistema.sh

# Dar permissão de execução
chmod +x atualizar_sistema.sh

# Executar a atualização
./atualizar_sistema.sh
```

### Atualização Manual
```bash
# 1. Acessar o diretório do projeto
cd /opt/fichapro

# 2. Fazer backup do banco
cd fichapro_backend
source venv/bin/activate
sudo -u postgres pg_dump fichapro_db > /tmp/backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Atualizar código
cd /opt/fichapro
git pull origin main

# 4. Atualizar backend
cd fichapro_backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# 5. Atualizar frontend
cd ../fichapro
npm install
npm run build

# 6. Reiniciar serviços
systemctl restart fichapro-backend
systemctl restart nginx
```

## 🔧 Comandos Úteis

### Verificar Status
```bash
# Status dos serviços
systemctl status fichapro-backend
systemctl status nginx

# Logs em tempo real
journalctl -u fichapro-backend -f
tail -f /var/log/nginx/error.log
```

### Reiniciar Serviços
```bash
# Reiniciar backend
systemctl restart fichapro-backend

# Reiniciar nginx
systemctl restart nginx

# Reiniciar tudo
systemctl restart fichapro-backend nginx
```

### Backup e Restore
```bash
# Backup do banco
sudo -u postgres pg_dump fichapro_db > backup.sql

# Restore do banco
sudo -u postgres psql fichapro_db < backup.sql
```

### Logs
```bash
# Logs do backend
journalctl -u fichapro-backend -f

# Logs do nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs do Django
tail -f /opt/fichapro/fichapro_backend/django.log
```

## 🌐 Configuração de Domínio

### 1. Configurar DNS
Aponte seu domínio para o IP do servidor:
```
A    fichapro.seudominio.com    IP_DO_SERVIDOR
```

### 2. Configurar Nginx
Editar `/etc/nginx/sites-available/fichapro`:
```nginx
server {
    listen 80;
    server_name fichapro.seudominio.com;  # Seu domínio aqui
    
    # ... resto da configuração
}
```

### 3. Configurar SSL/HTTPS
```bash
# Instalar certificado SSL
certbot --nginx -d fichapro.seudominio.com

# Renovar automaticamente
crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔐 Segurança

### 1. Alterar senhas padrão
```bash
# Acessar Django admin
http://seu-dominio.com/admin/

# Login: admin / admin123
# Alterar senha imediatamente
```

### 2. Configurar firewall
```bash
# Verificar status
ufw status

# Permitir apenas portas necessárias
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 3. Configurar backup automático
```bash
# Criar script de backup
cat > /opt/fichapro/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/fichapro"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup do banco
sudo -u postgres pg_dump fichapro_db > $BACKUP_DIR/db_$DATE.sql

# Backup dos arquivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /opt/fichapro

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/fichapro/backup.sh

# Agendar backup diário
crontab -e
# Adicionar: 0 2 * * * /opt/fichapro/backup.sh
```

## 🚨 Troubleshooting

### Problema: Serviço não inicia
```bash
# Verificar logs
journalctl -u fichapro-backend -n 50

# Verificar permissões
ls -la /opt/fichapro/
chown -R www-data:www-data /opt/fichapro/
```

### Problema: Erro de banco de dados
```bash
# Verificar conexão
sudo -u postgres psql -d fichapro_db -c "SELECT version();"

# Verificar migrações
cd /opt/fichapro/fichapro_backend
source venv/bin/activate
python manage.py showmigrations
```

### Problema: Frontend não carrega
```bash
# Verificar build
ls -la /opt/fichapro/fichapro/dist/

# Rebuild
cd /opt/fichapro/fichapro
npm run build
```

### Problema: Nginx não funciona
```bash
# Verificar configuração
nginx -t

# Verificar logs
tail -f /var/log/nginx/error.log

# Reiniciar
systemctl restart nginx
```

## 📞 Suporte

- **Repositório:** https://github.com/vitorduarteebb/fichapro3
- **Issues:** https://github.com/vitorduarteebb/fichapro3/issues
- **Documentação:** Este README

## 📝 Notas Importantes

1. **Sempre faça backup antes de atualizar**
2. **Teste em ambiente de desenvolvimento primeiro**
3. **Mantenha o sistema atualizado**
4. **Monitore os logs regularmente**
5. **Configure alertas de monitoramento**
6. **Faça backup regular do banco de dados**

---

**FichaPro** - Sistema de Gerenciamento de Fichas Técnicas para Restaurantes 