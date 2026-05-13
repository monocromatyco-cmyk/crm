export interface Client {
  id: string;
  companyName: string;
  representativeName: string;
  role: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  unit: string;
  basePrice: number;
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  title: string;
  status: 'borrador' | 'enviada' | 'aceptada' | 'rechazada';
  currency: string;
  applyTax: boolean;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  validUntil: string;
  notes: string;
  items: QuoteItem[];
  createdAt: string;
}

export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface ReceiptPayment {
  id: string;
  amount: number;
  method: string;
  note: string;
  paidAt: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  clientId: string;
  clientName: string;
  quoteId: string;
  currency: string;
  applyTax: boolean;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balance: number;
  paymentMethod: string;
  status: 'pendiente' | 'parcial' | 'pagado';
  notes: string;
  items: ReceiptItem[];
  payments: ReceiptPayment[];
  issuedAt: string;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  unitCost: number;
  supplier: string;
  location: string;
  lastRestocked: string;
  createdAt: string;
}

export interface MaterialMovement {
  id: string;
  materialId: string;
  type: 'entrada' | 'salida' | 'ajuste';
  quantity: number;
  note: string;
  date: string;
}

export interface Settings {
  businessName: string;
  logoUrl: string;
  qrUrl: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  defaultTaxRate: number;
  bankName: string;
  bankAccount: string;
  bankClabe: string;
  bankBeneficiary: string;
}

export type ViewId = 'dashboard' | 'clientes' | 'servicios' | 'cotizaciones' | 'ventas' | 'materiales' | 'config';
