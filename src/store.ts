import { Client, Service, Quote, Receipt, Settings, Material, MaterialMovement } from './types';
import { syncToFirestore, listenToFirestore } from './firebase';

const KEYS = {
  clients: 'orbita_clients',
  services: 'orbita_services',
  quotes: 'orbita_quotes',
  receipts: 'orbita_receipts',
  settings: 'orbita_settings',
  materials: 'orbita_materials',
  materialMovements: 'orbita_material_movements',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Clients ──
export function getClients(): Client[] { return load<Client[]>(KEYS.clients, []); }
export function saveClients(clients: Client[]) {
  save(KEYS.clients, clients);
  syncToFirestore('crm', KEYS.clients, clients);
}

// ── Services ──
export function getServices(): Service[] { return load<Service[]>(KEYS.services, []); }
export function saveServices(services: Service[]) {
  save(KEYS.services, services);
  syncToFirestore('crm', KEYS.services, services);
}

// ── Quotes ──
export function getQuotes(): Quote[] { return load<Quote[]>(KEYS.quotes, []); }
export function saveQuotes(quotes: Quote[]) {
  save(KEYS.quotes, quotes);
  syncToFirestore('crm', KEYS.quotes, quotes);
}

// ── Receipts ──
export function getReceipts(): Receipt[] { return load<Receipt[]>(KEYS.receipts, []); }
export function saveReceipts(receipts: Receipt[]) {
  save(KEYS.receipts, receipts);
  syncToFirestore('crm', KEYS.receipts, receipts);
}

// ── Materials ──
export function getMaterials(): Material[] { return load<Material[]>(KEYS.materials, []); }
export function saveMaterials(materials: Material[]) {
  save(KEYS.materials, materials);
  syncToFirestore('crm', KEYS.materials, materials);
}

// ── Material Movements ──
export function getMaterialMovements(): MaterialMovement[] { return load<MaterialMovement[]>(KEYS.materialMovements, []); }
export function saveMaterialMovements(movements: MaterialMovement[]) {
  save(KEYS.materialMovements, movements);
  syncToFirestore('crm', KEYS.materialMovements, movements);
}

// ── Settings ──
const defaultSettings: Settings = {
  businessName: 'Órbita CRM',
  logoUrl: '',
  qrUrl: '',
  phone: '',
  email: '',
  address: '',
  currency: 'MXN',
  defaultTaxRate: 16,
  bankName: '',
  bankAccount: '',
  bankClabe: '',
  bankBeneficiary: '',
};

export function getSettings(): Settings { return load<Settings>(KEYS.settings, defaultSettings); }
export function saveSettings(settings: Settings) {
  save(KEYS.settings, settings);
  syncToFirestore('crm', KEYS.settings, settings);
}

// ── Sync listeners ──
export type SyncCallback = {
  onClients?: (data: Client[]) => void;
  onServices?: (data: Service[]) => void;
  onQuotes?: (data: Quote[]) => void;
  onReceipts?: (data: Receipt[]) => void;
  onSettings?: (data: Settings) => void;
  onMaterials?: (data: Material[]) => void;
  onMaterialMovements?: (data: MaterialMovement[]) => void;
};

let ignoreNextSync: Record<string, number> = {};

export function markLocalWrite(key: string) {
  ignoreNextSync[key] = Date.now();
}

export function setupSyncListeners(callbacks: SyncCallback): () => void {
  const unsubs: ((() => void) | null)[] = [];

  const handleStorage = (e: StorageEvent) => {
    if (!e.key || !e.newValue) return;
    try {
      const data = JSON.parse(e.newValue);
      if (e.key === KEYS.clients && callbacks.onClients) callbacks.onClients(data);
      if (e.key === KEYS.services && callbacks.onServices) callbacks.onServices(data);
      if (e.key === KEYS.quotes && callbacks.onQuotes) callbacks.onQuotes(data);
      if (e.key === KEYS.receipts && callbacks.onReceipts) callbacks.onReceipts(data);
      if (e.key === KEYS.settings && callbacks.onSettings) callbacks.onSettings(data);
      if (e.key === KEYS.materials && callbacks.onMaterials) callbacks.onMaterials(data);
      if (e.key === KEYS.materialMovements && callbacks.onMaterialMovements) callbacks.onMaterialMovements(data);
    } catch { /* ignore */ }
  };

  window.addEventListener('storage', handleStorage);

  const createListener = <T>(key: string, callback?: (data: T) => void) => {
    if (!callback) return;
    const u = listenToFirestore('crm', key, (data) => {
      const now = Date.now();
      if (ignoreNextSync[key] && now - ignoreNextSync[key] < 3000) return;
      save(key, data);
      callback(data as T);
    });
    unsubs.push(u);
  };

  createListener<Client[]>(KEYS.clients, callbacks.onClients);
  createListener<Service[]>(KEYS.services, callbacks.onServices);
  createListener<Quote[]>(KEYS.quotes, callbacks.onQuotes);
  createListener<Receipt[]>(KEYS.receipts, callbacks.onReceipts);
  createListener<Settings>(KEYS.settings, callbacks.onSettings);
  createListener<Material[]>(KEYS.materials, callbacks.onMaterials);
  createListener<MaterialMovement[]>(KEYS.materialMovements, callbacks.onMaterialMovements);

  return () => {
    window.removeEventListener('storage', handleStorage);
    unsubs.forEach((u) => u?.());
    ignoreNextSync = {};
  };
}

// ── ID generator ──
let counter = Date.now();
export function genId(): string {
  return (++counter).toString(36) + Math.random().toString(36).slice(2, 6);
}
