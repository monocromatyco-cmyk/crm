import { Client, Service, Quote, Receipt, Settings } from './types';

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
}

// ── Services ──
export function getServices(): Service[] {
  return load<Service[]>(KEYS.services, []);
}
export function saveServices(services: Service[]) {
  save(KEYS.services, services);
}

// ── Quotes ──
export function getQuotes(): Quote[] {
  return load<Quote[]>(KEYS.quotes, []);
}
export function saveQuotes(quotes: Quote[]) {
  save(KEYS.quotes, quotes);
}

// ── Receipts ──
export function getReceipts(): Receipt[] {
  return load<Receipt[]>(KEYS.receipts, []);
}
export function saveReceipts(receipts: Receipt[]) {
  save(KEYS.receipts, receipts);
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
}

// ── ID generator ──
let counter = Date.now();
export function genId(): string {
  return (++counter).toString(36) + Math.random().toString(36).slice(2, 6);
}
