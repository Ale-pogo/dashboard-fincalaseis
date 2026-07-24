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
    <div className="min-h-screen bg-fondo-sitio font-sans text-current transition-colors duration-300 flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Barra Lateral Izquierda (Sidebar) */}
        <aside className="relative w-full md:w-72 lg:w-80 bg-verde-bosque text-white flex flex-col shadow-xl overflow-hidden md:min-h-screen">
          <div className="absolute inset-0 bg-gradient-to-br from-green-950/70 via-green-900/40 to-green-800/70" />

          <div className="relative z-10 p-4 sm:p-5 border-b border-green-800/70 flex flex-col items-center text-center">
            <img src={logoLaSeis} alt="Logo La Seis" className="h-20 w-auto sm:h-24 lg:h-28 mb-2" />
            <p className="text-xs text-green-300 italic">Agropecuaria Riojana</p>
          </div>

          <nav className="relative z-10 flex-1 p-4 sm:p-5 space-y-2 overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModule('compras')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium shadow-xs transition-all text-left ${activeModule === 'compras' ? 'bg-verde-esmeralda text-white' : 'text-green-300 hover:bg-green-800/50'}`}
            >
              <ShoppingCart className="w-5 h-5 text-current shrink-0" />
              <span className="text-sm sm:text-base">Requerimiento Compras</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('gastos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium shadow-xs transition-all text-left ${activeModule === 'gastos' ? 'bg-verde-esmeralda text-white' : 'text-green-300 hover:bg-green-800/50'}`}
            >
              <BarChart3 className="w-5 h-5 text-current shrink-0" />
              <span className="text-sm sm:text-base">Gastos Semanales</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('quimicos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium shadow-xs transition-all text-left ${activeModule === 'quimicos' ? 'bg-verde-esmeralda text-white' : 'text-green-300 hover:bg-green-800/50'}`}
            >
              <FlaskConical className="w-5 h-5 text-current shrink-0" />
              <span className="text-sm sm:text-base">Pedidos Químicos</span>
            </button>
          </nav>
        </aside>

        {/* Área de Contenido Principal */}
        <main className="flex-1 min-h-screen p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="mb-4 flex justify-end">
            <ThemeToggle />
          </div>
          <SharedSummary />
          {activeModule === 'compras' && <ComprasDashboard />}
          {activeModule === 'gastos' && <GastosDashboard />}
          {activeModule === 'quimicos' && <PedidosQuimicosDashboard />}
        </main>
      </div>

      <footer className="bg-[color:var(--color-surface)] border-t border-[color:var(--color-border)] text-[color:var(--color-text)]">
        <div className="mx-auto flex flex-wrap items-center justify-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <img src={logoCha} alt="CHA logo" className="h-10 w-auto" />
          <span className="text-sm text-center">© 2026 CHA - Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;