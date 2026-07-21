import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// Servir archivos estáticos desde dist
app.use(express.static(path.join(__dirname, 'dist')));

// Para SPA, redirigir todas las rutas a index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }

  console.log('\n✅ Dashboard Agrícola iniciado');
  console.log(`\n📱 Accede desde este PC: http://localhost:${PORT}`);
  console.log(`🌐 Accede desde otros PCs: http://${localIP}:${PORT}\n`);
});
