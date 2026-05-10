import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, Package, FileText, ShoppingCart,
  Settings as SettingsIcon, Menu, Orbit,
} from 'lucide-react';
import { ViewId, Client, Service, Quote, Receipt as ReceiptType, Settings } from './types';
import {
  getClients, saveClients, getServices, saveServices,
  getQuotes, saveQuotes, getReceipts, saveReceipts,
  getSettings, saveSettings, setupSyncListeners, markLocalWrite,
} from './store';
import Dashboard from './components/Dashboard';
import ClientsView from './components/ClientsView';
import ServicesView from './components/ServicesView';
import QuotesView from './components/QuotesView';
import ReceiptsView from './components/ReceiptsView';
import SettingsView from './components/SettingsView';

const NAV_ITEMS: { id: ViewId; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'clientes', label: 'Clientes', Icon: Users },
  { id: 'servicios', label: 'Servicios', Icon: Package },
  { id: 'cotizaciones', label: 'Cotizaciones', Icon: FileText },
  { id: 'ventas', label: 'PO / Ventas', Icon: ShoppingCart },
  { id: 'config', label: 'Configuración', Icon: SettingsIcon },
];

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [quotes, setQuotesState] = useState<Quote[]>([]);
  const [receipts, setReceiptsState] = useState<ReceiptType[]>([]);
  const [settings, setSettingsState] = useState<Settings>(getSettings());

  // Load data on mount
  useEffect(() => {
    setClients(getClients());
    setServices(getServices());
    setQuotesState(getQuotes());
    setReceiptsState(getReceipts());
    setSettingsState(getSettings());
  }, []);

  // Setup sync listeners (localStorage events + Firestore)
  useEffect(() => {
    const cleanup = setupSyncListeners({
      onClients: (data) => setClients(data),
      onServices: (data) => setServices(data),
      onQuotes: (data) => setQuotesState(data),
      onReceipts: (data) => setReceiptsState(data),
      onSettings: (data) => setSettingsState(data),
    });
    return cleanup;
  }, []);

  const handleClients = useCallback((data: Client[]) => {
    markLocalWrite('orbita_clients');
    setClients(data);
    saveClients(data);
  }, []);

  const handleServices = useCallback((data: Service[]) => {
    markLocalWrite('orbita_services');
    setServices(data);
    saveServices(data);
  }, []);

  const handleQuotes = useCallback((data: Quote[]) => {
    markLocalWrite('orbita_quotes');
    setQuotesState(data);
    saveQuotes(data);
  }, []);

  const handleReceipts = useCallback((data: ReceiptType[]) => {
    markLocalWrite('orbita_receipts');
    setReceiptsState(data);
    saveReceipts(data);
  }, []);

  const handleSettings = useCallback((data: Settings) => {
    markLocalWrite('orbita_settings');
    setSettingsState(data);
    saveSettings(data);
  }, []);

  function navigate(id: ViewId) {
    setActiveView(id);
    setSidebarOpen(false);
  }

  const activeNav = NAV_ITEMS.find((n) => n.id === activeView)!;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-xl
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:shadow-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Orbit className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-800">{settings.businessName || 'Órbita CRM'}</h1>
              <p className="text-xs text-slate-400">Gestión integral</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${activeView === id
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">Moneda: <span className="font-bold text-slate-700">{settings.currency}</span></p>
              <p className="text-xs text-slate-400 mt-1">IVA: {settings.defaultTaxRate}%</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <activeNav.Icon className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-slate-800">{activeNav.label}</span>
            </div>
          </div>
          <span className="text-sm text-slate-500 hidden sm:block">{settings.businessName}</span>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeView === 'dashboard' && (
            <Dashboard clients={clients} quotes={quotes} receipts={receipts} currency={settings.currency} />
          )}
          {activeView === 'clientes' && (
            <ClientsView clients={clients} onChange={handleClients} />
          )}
          {activeView === 'servicios' && (
            <ServicesView services={services} currency={settings.currency} onChange={handleServices} />
          )}
          {activeView === 'cotizaciones' && (
            <QuotesView quotes={quotes} clients={clients} services={services} settings={settings} onChange={handleQuotes} />
          )}
          {activeView === 'ventas' && (
            <ReceiptsView receipts={receipts} clients={clients} services={services} quotes={quotes} settings={settings} onChange={handleReceipts} />
          )}
          {activeView === 'config' && (
            <SettingsView settings={settings} onChange={handleSettings} />
          )}
        </div>
      </main>

      {/* FAB mobile */}
      <button
        onClick={() => {
          if (activeView === 'clientes') {
            // Trigger new client - dispatch custom event
            document.dispatchEvent(new CustomEvent('crm:new-item'));
          } else if (activeView === 'servicios') {
            document.dispatchEvent(new CustomEvent('crm:new-item'));
          } else if (activeView === 'cotizaciones') {
            document.dispatchEvent(new CustomEvent('crm:new-item'));
          } else if (activeView === 'ventas') {
            document.dispatchEvent(new CustomEvent('crm:new-item'));
          }
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center text-2xl lg:hidden transition z-30"
      >
        +
      </button>
    </div>
  );
}
