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
import PrintDocument from './components/PrintDocument';

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

  // Print state
  const [printQuote, setPrintQuote] = useState<Quote | null>(null);
  const [printReceipt, setPrintReceipt] = useState<ReceiptType | null>(null);

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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Orbit className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight text-gray-900">{settings.businessName || 'Órbita CRM'}</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Gestión integral</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${activeView === id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <Icon className={`w-5 h-5 ${activeView === id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {label}
                {activeView === id && <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 lg:px-6 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <activeNav.Icon className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-bold text-gray-900">{activeNav.label}</h2>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
          {activeView === 'dashboard' && <Dashboard clients={clients} quotes={quotes} receipts={receipts} settings={settings} />}
          {activeView === 'clientes' && <ClientsView clients={clients} onChange={handleClients} />}
          {activeView === 'servicios' && <ServicesView services={services} settings={settings} onChange={handleServices} />}
          {activeView === 'cotizaciones' && (
            <QuotesView
              quotes={quotes} clients={clients} services={services} settings={settings}
              onChange={handleQuotes} onPrint={(q) => setPrintQuote(q)}
            />
          )}
          {activeView === 'ventas' && (
            <ReceiptsView
              receipts={receipts} clients={clients} quotes={quotes} settings={settings}
              onChange={handleReceipts} onPrint={(r) => setPrintReceipt(r)}
            />
          )}
          {activeView === 'materiales' && (
            <MaterialsView
              materials={materials} movements={materialMovements} settings={settings}
              onChangeMaterials={handleMaterials} onChangeMovements={handleMaterialMovements}
            />
          )}
          {activeView === 'config' && <SettingsView settings={settings} onChange={handleSettings} />}
        </div>

        {/* FAB menu items */}
        {fabOpen && (
          <div className="fixed bottom-24 right-6 z-30 flex flex-col gap-2 lg:hidden">
            {NAV_ITEMS.filter(n => n.id !== activeView).map((item, i) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <item.Icon className="w-4 h-4 text-blue-500" />
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* FAB overlay */}
        {fabOpen && (
          <div className="fixed inset-0 z-20 bg-black/10 lg:hidden" onClick={() => setFabOpen(false)} />
        )}

        {/* FAB button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform duration-300 lg:hidden active:scale-95"
          style={{ transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          {fabOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
        </button>
      </main>

      {/* Print overlays */}
      {printQuote && (
        <PrintDocument type="quote" quote={printQuote} settings={settings} onClose={() => setPrintQuote(null)} />
      )}
      {printReceipt && (
        <PrintDocument type="receipt" receipt={printReceipt} settings={settings} onClose={() => setPrintReceipt(null)} />
      )}
    </div>
  );
}
