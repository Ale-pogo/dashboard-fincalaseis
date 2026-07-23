import React, { useState } from 'react';
import { ComprasDashboard } from './features/compras/ComprasDashboard';
import { GastosDashboard } from './features/gasto/GastosDashboard';
import { ShoppingCart, BarChart3, FlaskConical } from 'lucide-react';
import { PedidosQuimicosDashboard } from './features/quimicos/PedidosQuimicosDashboard';
import { SharedSummary } from './components/SharedSummary';
import ThemeToggle from './components/ThemeToggle';
import logoCha from './assets/logo_cha.svg';
import logoLaSeis from './assets/logo La Seis.svg';

function App() {
  const [activeModule, setActiveModule] = useState('compras');

  return (
    <div className="min-h-screen bg-fondo-sitio font-sans flex flex-col md:flex-row">
      {/* Barra Lateral Izquierda (Sidebar) */}
      <aside className="relative w-full md:w-64 bg-verde-bosque text-white flex flex-col shadow-xl overflow-hidden md:min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/70 via-green-900/40 to-green-800/70" />

        <div className="relative z-10 p-5 border-b border-green-800 flex flex-col items-center text-center">
          <img src={logoLaSeis} alt="Logo La Seis" className="h-28 w-auto mb-2" />
          <p className="text-xs text-green-400 italic">Agropecuaria Riojana</p>
        </div>
        
        <nav className="relative z-10 flex-1 p-4 space-y-2">
          <button
            type="button"
            onClick={() => setActiveModule('compras')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium shadow-xs transition-all ${activeModule === 'compras' ? 'bg-verde-esmeralda text-white' : 'text-green-300 hover:bg-green-800/50'}`}
          >
            <ShoppingCart className="w-5 h-5 text-current" />
            Requerimiento Compras
          </button>
          
          <button
            type="button"
            onClick={() => setActiveModule('gastos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium shadow-xs transition-all ${activeModule === 'gastos' ? 'bg-verde-esmeralda text-white' : 'text-green-300 hover:bg-green-800/50'}`}
          >
            <BarChart3 className="w-5 h-5 text-current" />
            Gastos Semanales
          </button>
          
          <button
            type="button"
            onClick={() => setActiveModule('quimicos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium shadow-xs transition-all ${activeModule === 'quimicos' ? 'bg-verde-esmeralda text-white' : 'text-green-300 hover:bg-green-800/50'}`}
          >
            <FlaskConical className="w-5 h-5 text-current" />
            Pedidos Químicos
          </button>
        </nav>
        
        <div className="relative z-10 p-4 border-t border-green-800 text-xs text-green-400 text-center flex flex-col items-center gap-2">
          <img src={logoCha} alt="CHA logo" className="h-10 w-auto" />
          <span>© 2026 CHA - Todos los derechos reservados.</span>
        </div>
      </aside>

      {/* Área de Contenido Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        <SharedSummary />
        {activeModule === 'compras' && <ComprasDashboard />}
        {activeModule === 'gastos' && <GastosDashboard />}
        {activeModule === 'quimicos' && <PedidosQuimicosDashboard />}
      </main>
    </div>
  );
}

export default App;