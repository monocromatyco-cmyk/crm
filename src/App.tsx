import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, Package, FileText, ShoppingCart,
  Settings as SettingsIcon, Menu, Orbit, Boxes, X,
  ChevronRight,
} from 'lucide-react';
import { ViewId, Client, Service, Quote, Receipt as ReceiptType, Settings, Material, MaterialMovement } from './types';
import {
  getClients, saveClients, getServices, saveServices,
  getQuotes, saveQuotes, getReceipts, saveReceipts,
  getSettings, saveSettings, setupSyncListeners, markLocalWrite,
  getMaterials, saveMaterials, getMaterialMovements, saveMaterialMovements,
} from './store';
import Dashboard from './components/Dashboard';
import ClientsView from './components/ClientsView';
import ServicesView from './components/ServicesView';
import QuotesView from './components/QuotesView';
import ReceiptsView from './components/ReceiptsView';
import SettingsView from './components/SettingsView';
import MaterialsView from './components/MaterialsView';

const NAV_ITEMS: { id: ViewId; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'clientes', label: 'Clientes', Icon: Users },
  { id: 'servicios', label: 'Servicios', Icon: Package },
  { id: 'cotizaciones', label: 'Cotizaciones', Icon: FileText },
  { id: 'ventas', label: 'PO / Ventas', Icon: ShoppingCart },
  { id: 'materiales', label: 'Materiales', Icon: Boxes },
  { id: 'config', label: 'Configuración', Icon: SettingsIcon },
];

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [quotes, setQuotesState] = useState<Quote[]>([]);
  const [receipts, setReceiptsState] = useState<ReceiptType[]>([]);
  const [settings, setSettingsState] = useState<Settings>(getSettings());
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialMovements, setMaterialMovements] = useState<MaterialMovement[]>([]);

  // Load data
  useEffect(() => {
    setClients(getClients());
    setServices(getServices());
    setQuotesState(getQuotes());
    setReceiptsState(getReceipts());
    setSettingsState(getSettings());
    setMaterials(getMaterials());
    setMaterialMovements(getMaterialMovements());
  }, []);

  // Sync listeners
  useEffect(() => {
    const cleanup = setupSyncListeners({
      onClients: (data) => setClients(data),
      onServices: (data) => setServices(data),
      onQuotes: (data) => setQuotesState(data),
      onReceipts: (data) => setReceiptsState(data),
      onSettings: (data) => setSettingsState(data),
      onMaterials: (data) => setMaterials(data),
      onMaterialMovements: (data) => setMaterialMovements(data),
    });
    return cleanup;
  }, []);

  const handleClients = useCallback((data: Client[]) => {
    markLocalWrite('orbita_clients'); setClients(data); saveClients(data);
  }, []);
  const handleServices = useCallback((data: Service[]) => {
    markLocalWrite('orbita_services'); setServices(data); saveServices(data);
  }, []);
  const handleQuotes = useCallback((data: Quote[]) => {
    markLocalWrite('orbita_quotes'); setQuotesState(data); saveQuotes(data);
  }, []);
  const handleReceipts = useCallback((data: ReceiptType[]) => {
    markLocalWrite('orbita_receipts'); setReceiptsState(data); saveReceipts(data);
  }, []);
  const handleSettings = useCallback((data: Settings) => {
    markLocalWrite('orbita_settings'); setSettingsState(data); saveSettings(data);
  }, []);
  const handleMaterials = useCallback((data: Material[]) => {
    markLocalWrite('orbita_materials'); setMaterials(data); saveMaterials(data);
  }, []);
  const handleMaterialMovements = useCallback((data: MaterialMovement[]) => {
    markLocalWrite('orbita_material_movements'); setMaterialMovements(data); saveMaterialMovements(data);
  }, []);

  function navigate(id: ViewId) {
    setActiveView(id);
    setSidebarOpen(false);
    setFabOpen(false);
  }

  const activeNav = NAV_ITEMS.find((n) => n.id === activeView)!;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/50">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Orbit className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight text-white">{settings.businessName || 'Órbita CRM'}</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Gestión integral</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${activeView === id
                    ? 'bg-blue-500/10 text-blue-400 shadow-sm border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {label}
                {activeView === id && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800/50">
            <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 rounded-xl p-3 text-center border border-blue-500/10">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Órbita CRM</p>
              <p className="text-[10px] text-slate-600 mt-0.5">v2.0 — PWA</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-2">
              <activeNav.Icon className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">{activeNav.label}</h2>
            </div>
          </div>
          <p className="text-xs text-slate-600 hidden sm:block">{settings.businessName}</p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6">
          {activeView === 'dashboard' && (
            <Dashboard clients={clients} quotes={quotes} receipts={receipts} settings={settings} />
          )}
          {activeView === 'clientes' && (
            <ClientsView clients={clients} onChange={handleClients} />
          )}
          {activeView === 'servicios' && (
            <ServicesView services={services} settings={settings} onChange={handleServices} />
          )}
          {activeView === 'cotizaciones' && (
            <QuotesView quotes={quotes} clients={clients} services={services} settings={settings} onChange={handleQuotes} />
          )}
          {activeView === 'ventas' && (
            <ReceiptsView receipts={receipts} clients={clients} quotes={quotes} settings={settings} onChange={handleReceipts} />
          )}
          {activeView === 'materiales' && (
            <MaterialsView materials={materials} movements={materialMovements} settings={settings} onChangeMaterials={handleMaterials} onChangeMovements={handleMaterialMovements} />
          )}
          {activeView === 'config' && (
            <SettingsView settings={settings} onChange={handleSettings} />
          )}
        </div>
      </main>

      {/* FAB mobile - FUNCTIONAL */}
      <div className="lg:hidden fixed bottom-6 right-6 z-30">
        {/* FAB menu items */}
        {fabOpen && (
          <div className="absolute bottom-16 right-0 space-y-2 mb-2">
            {NAV_ITEMS.filter(n => n.id !== activeView).map((item, i) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className="flex items-center gap-2 bg-slate-800 border border-slate-700/50 text-slate-200 px-4 py-2.5 rounded-xl shadow-xl whitespace-nowrap text-sm font-medium hover:bg-slate-700 transition-all"
                style={{ animation: `fadeSlideIn 0.2s ease-out ${i * 0.04}s both` }}
              >
                <item.Icon className="w-4 h-4 text-blue-400" />
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* FAB overlay */}
        {fabOpen && (
          <div className="fixed inset-0 z-[-1]" onClick={() => setFabOpen(false)} />
        )}

        {/* FAB button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`
            w-14 h-14 rounded-2xl flex items-center justify-center
            shadow-xl transition-all duration-300
            ${fabOpen
              ? 'bg-slate-700 rotate-45 shadow-slate-500/20'
              : 'bg-gradient-to-br from-blue-600 to-blue-500 shadow-blue-500/30 hover:shadow-blue-500/40'
            }
          `}
        >
          {fabOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
