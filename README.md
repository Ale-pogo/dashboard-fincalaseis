# Dashboard Agrícola 2026

Sistema de análisis de datos agrícolas con dashboard interactivo basado en archivos Excel.

## 📊 Características

- Dashboard interactivo con visualizaciones en tiempo real
- Análisis de tres fuentes de datos Excel:
  - Gastos semanales
  - Pedidos de químicos campaña 2026
  - Requerimientos de compras
- Acceso desde cualquier PC en la red local
- Interfaz moderna con Tailwind CSS y Recharts

## 🚀 Instalación y Ejecución

### Instalación inicial
```bash
npm install
```

### Desarrollo local
```bash
npm run dev
```
Accede a `http://localhost:5173` en tu navegador.

### Producción - Acceso desde la red local

#### Opción 1: Ejecución rápida (Build + Servidor)
```bash
npm run build-start
```

#### Opción 2: Pasos separados
```bash
# Compilar la aplicación
npm run build

# Iniciar el servidor
npm start
```

### 📱 Acceso

- **Este PC**: `http://localhost:3000`
- **Otros PCs en la red**: Reemplaza `192.168.18.12` con tu IP local
  ```
  http://192.168.18.12:3000
  ```

Para encontrar tu IP local, ejecuta en Windows:
```powershell
ipconfig
```
Busca "IPv4" bajo tu adaptador de red activo.

## 📁 Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
├── features/       # Dashboards específicos (compras, gastos, químicos)
├── hooks/          # Hooks personalizados (lectura de Excel)
├── styles/         # Estilos CSS
public/
├── data/           # Archivos Excel (fuentes de datos)
dist/              # Aplicación compilada (generada con build)
```

## 🔧 Scripts disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Compila la aplicación para producción
- `npm start` - Inicia servidor Express para acceso en red
- `npm run build-start` - Compila e inicia servidor de una vez
- `npm run preview` - Vista previa de la versión compilada
- `npm run lint` - Ejecuta validación de código

## 📊 Archivos de datos

Los archivos Excel deben estar en `public/data/`:
- `Gastos semanaless.xlsx`
- `pedido quimicos campaña 2026 valorizado.xlsx`
- `Requerimiento - Compras.xlsx`

## 🛠️ Tecnologías

- **React 19** - Framework UI
- **Vite** - Herramienta de build
- **Tailwind CSS** - Estilos
- **Recharts** - Gráficos
- **XLSX** - Lectura de archivos Excel
- **Express** - Servidor Node.js
- **Lucide React** - Iconos

## 📝 Notas

- El servidor escucha en todas las interfaces de red (0.0.0.0:3000)
- Los archivos Excel se cargan desde el navegador usando fetch
- La aplicación es una SPA (Single Page Application)
