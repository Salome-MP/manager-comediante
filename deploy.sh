#!/bin/bash
# =============================================================
# Deploy script para atheris.perucomedia.com
# Ejecutar EN EL SERVIDOR despues de subir el codigo
# =============================================================

set -e

echo "=== 1. Instalando dependencias del sistema ==="
sudo apt update
sudo apt install -y curl git nginx

# Node.js 22 via nvm
if ! command -v node &> /dev/null; then
  echo "Instalando Node.js 22..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 22
  nvm use 22
fi

# pnpm
if ! command -v pnpm &> /dev/null; then
  echo "Instalando pnpm..."
  npm install -g pnpm
fi

# PM2
if ! command -v pm2 &> /dev/null; then
  echo "Instalando PM2..."
  npm install -g pm2
fi

echo "=== 2. PostgreSQL ==="
if ! command -v psql &> /dev/null; then
  echo "Instalando PostgreSQL..."
  sudo apt install -y postgresql postgresql-contrib
  sudo systemctl start postgresql
  sudo systemctl enable postgresql

  # Crear usuario y DB
  sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'CAMBIAR_PASSWORD';"
  sudo -u postgres psql -c "CREATE DATABASE comediantes_db;"
  echo ">>> IMPORTANTE: Cambia 'CAMBIAR_PASSWORD' en backend/.env por la password que elegiste"
else
  echo "PostgreSQL ya instalado"
fi

echo "=== 3. Backend ==="
cd backend

# Copiar env de produccion
cp .env.production .env
echo ">>> EDITA backend/.env con las passwords correctas antes de continuar"

pnpm install
npx prisma generate
npx prisma db push
pnpm run build

cd ..

echo "=== 4. Frontend ==="
cd frontend

# Copiar env de produccion
cp .env.production .env.local

pnpm install
pnpm build

cd ..

echo "=== 5. Nginx ==="
sudo cp nginx.conf /etc/nginx/sites-available/atheris.perucomedia.com
sudo ln -sf /etc/nginx/sites-available/atheris.perucomedia.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "=== 6. SSL con Let's Encrypt ==="
if ! command -v certbot &> /dev/null; then
  sudo apt install -y certbot python3-certbot-nginx
fi
sudo certbot --nginx -d atheris.perucomedia.com --non-interactive --agree-tos -m tu@email.com
echo ">>> Si falla el SSL, ejecuta manualmente: sudo certbot --nginx -d atheris.perucomedia.com"

echo "=== 7. Iniciar servicios con PM2 ==="
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "=== 8. Seed data (opcional) ==="
echo ">>> Para cargar datos de prueba: cd backend && pnpm run seed"

echo ""
echo "============================================"
echo "  Deploy completado!"
echo "  URL: https://atheris.perucomedia.com"
echo "  API: https://atheris.perucomedia.com/api"
echo "  Docs: https://atheris.perucomedia.com/api/docs"
echo "============================================"
echo ""
echo "Comandos utiles:"
echo "  pm2 status          - Ver estado de servicios"
echo "  pm2 logs            - Ver logs en tiempo real"
echo "  pm2 restart all     - Reiniciar todo"
echo "  pm2 logs backend    - Logs solo del backend"
echo "  pm2 logs frontend   - Logs solo del frontend"
