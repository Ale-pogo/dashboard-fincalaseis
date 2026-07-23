# Guía de Deploy - Dashboard Agrícola

## 🚀 Opciones de Hosting

### Opción 1: Render (RECOMENDADO - Gratis)

1. **Registrarse en Render:**
   - Ve a https://dashboard.render.com
   - Crea una cuenta con GitHub

2. **Crear servicio web:**
   - Click en "New +" → "Web Service"
   - Conecta tu repositorio de GitHub
   - Configuración:
     - **Name:** dashboard-agricola
     - **Environment:** Node
     - **Build Command:** `npm ci && npm run build`
     - **Start Command:** `node server.js`
     - **Port:** 3000

3. **Variables de entorno:**
   - No son necesarias para esta app

4. **Obtener Webhook para CI/CD:**
   - Ve a Settings → Deploy Hook
   - Copia la URL del webhook
   - En tu repo GitHub: Settings → Secrets → New repository secret
   - Nombre: `RENDER_DEPLOY_HOOK`
   - Pega la URL

---

### Opción 2: Railway (Alternativa)

1. Ve a https://railway.app
2. Click en "Start a New Project"
3. Conecta tu repo GitHub
4. Railway detectará automáticamente que es un proyecto Node.js
5. Configure `PORT=3000` en variables de entorno

---

### Opción 3: Vercel (Para SPA estática)

Si solo necesitas servir la interfaz sin backend:
1. Ve a https://vercel.com
2. Importa tu repo GitHub
3. Build: `npm run build`
4. Output: `dist`

---

## ✅ Verificar que funciona localmente

```bash
npm ci
npm run build
npm start
```

Accede a: `http://localhost:3000`

---

## 🔧 Variables de entorno (si las necesitas)

Crea un archivo `.env` en la raíz:
```
VITE_API_URL=https://tu-backend.com
```

---

## 📝 Estado del Deploy

- ✅ Build GitHub Actions configurado
- ✅ Server.js listo
- ⏳ Espera: Configurar hosting (Render recomendado)
- ⏳ Espera: Agregar secrets a GitHub Actions
- ⏳ Espera: Deploy automático en cada push
