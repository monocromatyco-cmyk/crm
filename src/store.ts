import { Client, Service, Quote, Receipt, Settings } from './types';
import { syncToFirestore, listenToFirestore } from './firebase';

const KEYS = {
  clients: 'orbita_clients',
  services: 'orbita_services',
  quotes: 'orbita_quotes',
  receipts: 'orbita_receipts',
  settings: 'orbita_settings',
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
export function getClients(): Client[] {
  return load<Client[]>(KEYS.clients, []);
}
export function saveClients(clients: Client[]) {
  save(KEYS.clients, clients);
  syncToFirestore('crm', KEYS.clients, clients);
}

// ── Services ──
export function getServices(): Service[] {
  return load<Service[]>(KEYS.services, []);
}
export function saveServices(services: Service[]) {
  save(KEYS.services, services);
  syncToFirestore('crm', KEYS.services, services);
}

// ── Quotes ──
export function getQuotes(): Quote[] {
  return load<Quote[]>(KEYS.quotes, []);
}
export function saveQuotes(quotes: Quote[]) {
  save(KEYS.quotes, quotes);
  syncToFirestore('crm', KEYS.quotes, quotes);
}

// ── Receipts ──
export function getReceipts(): Receipt[] {
  return load<Receipt[]>(KEYS.receipts, []);
}
export function saveReceipts(receipts: Receipt[]) {
  save(KEYS.receipts, receipts);
  syncToFirestore('crm', KEYS.receipts, receipts);
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

export function getSettings(): Settings {
  return load<Settings>(KEYS.settings, defaultSettings);
}
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
};

// Flag to prevent echo (don't update from Firestore if we just wrote)
let ignoreNextSync: Record<string, number> = {};

export function markLocalWrite(key: string) {
  ignoreNextSync[key] = Date.now();
}

export function setupSyncListeners(callbacks: SyncCallback): (() => void) {
  const unsubs: ((() => void) | null)[] = [];

  // Also listen to localStorage changes from other tabs
  const handleStorage = (e: StorageEvent) => {
    if (!e.key || !e.newValue) return;
    try {
      const data = JSON.parse(e.newValue);
      if (e.key === KEYS.clients && callbacks.onClients) callbacks.onClients(data);
      if (e.key === KEYS.services && callbacks.onServices) callbacks.onServices(data);
      if (e.key === KEYS.quotes && callbacks.onQuotes) callbacks.onQuotes(data);
      if (e.key === KEYS.receipts && callbacks.onReceipts) callbacks.onReceipts(data);
      if (e.key === KEYS.settings && callbacks.onSettings) callbacks.onSettings(data);
    } catch { /* ignore */ }
  };
  window.addEventListener('storage', handleStorage);

  // Firestore listeners for cross-device sync
  if (callbacks.onClients) {
    const u = listenToFirestore('crm', KEYS.clients, (data) => {
      const now = Date.now();
      if (ignoreNextSync[KEYS.clients] && now - ignoreNextSync[KEYS.clients] < 3000) return;
      const arr = data as Client[];
      save(KEYS.clients, arr);
      callbacks.onClients!(arr);
    });
    unsubs.push(u);
  }

  if (callbacks.onServices) {
    const u = listenToFirestore('crm', KEYS.services, (data) => {
      const now = Date.now();
      if (ignoreNextSync[KEYS.services] && now - ignoreNextSync[KEYS.services] < 3000) return;
      const arr = data as Service[];
      save(KEYS.services, arr);
      callbacks.onServices!(arr);
    });
    unsubs.push(u);
  }

  if (callbacks.onQuotes) {
    const u = listenToFirestore('crm', KEYS.quotes, (data) => {
      const now = Date.now();
      if (ignoreNextSync[KEYS.quotes] && now - ignoreNextSync[KEYS.quotes] < 3000) return;
      const arr = data as Quote[];
      save(KEYS.quotes, arr);
      callbacks.onQuotes!(arr);
    });
    unsubs.push(u);
  }

  if (callbacks.onReceipts) {
    const u = listenToFirestore('crm', KEYS.receipts, (data) => {
      const now = Date.now();
      if (ignoreNextSync[KEYS.receipts] && now - ignoreNextSync[KEYS.receipts] < 3000) return;
      const arr = data as Receipt[];
      save(KEYS.receipts, arr);
      callbacks.onReceipts!(arr);
    });
    unsubs.push(u);
  }

  if (callbacks.onSettings) {
    const u = listenToFirestore('crm', KEYS.settings, (data) => {
      const now = Date.now();
      if (ignoreNextSync[KEYS.settings] && now - ignoreNextSync[KEYS.settings] < 3000) return;
      const s = data as Settings;
      save(KEYS.settings, s);
      callbacks.onSettings!(s);
    });
    unsubs.push(u);
  }

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
