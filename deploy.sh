#!/bin/bash

# Script para deployar el dashboard a Render
# Uso: bash deploy.sh <webhook_url>

set -e

WEBHOOK_URL="${1}"

if [ -z "$WEBHOOK_URL" ]; then
  echo "❌ Error: Debes pasar la URL del webhook de Render"
  echo ""
  echo "Uso:"
  echo "  bash deploy.sh <webhook_url>"
  echo ""
  echo "Ejemplo:"
  echo "  bash deploy.sh https://api.render.com/deploy/srv-xxxxxxxxxxxx?key=xxxxx"
  exit 1
fi

echo "🚀 Construyendo aplicación..."
npm run build

echo "📤 Enviando a Render..."
curl -X POST "$WEBHOOK_URL"

echo ""
echo "✅ Deploy enviado!"
echo "Verifica el progreso en: https://dashboard.render.com"
