import { useState } from 'react';
import { Receipt, ReceiptItem, ReceiptPayment, Client, Quote, Settings } from '../types';
import { genId } from '../store';
import { Search, Plus, ShoppingCart, X, Trash2, Printer, ChevronDown, CreditCard } from 'lucide-react';

interface Props {
  receipts: Receipt[];
  clients: Client[];
  quotes: Quote[];
  settings: Settings;
  onChange: (receipts: Receipt[]) => void;
  onPrint: (receipt: Receipt) => void;
}

export default function ReceiptsView({ receipts, clients, quotes, settings, onChange, onPrint }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Receipt | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: settings.currency }).format(n);

  const filtered = receipts.filter((r) => {
    const s = search.toLowerCase();
    return r.receiptNumber.toLowerCase().includes(s) || r.clientName.toLowerCase().includes(s);
  });

  function nextReceiptNumber() {
    const max = receipts.reduce((m, r) => {
      const num = parseInt(r.receiptNumber.replace(/\D/g, '')) || 0;
      return num > m ? num : m;
    }, 0);
    return `PO-${String(max + 1).padStart(4, '0')}`;
  }

  function openNew() {
    setEditing({
      id: genId(), receiptNumber: nextReceiptNumber(), clientId: '', clientName: '',
      quoteId: '', currency: settings.currency,
      applyTax: true, taxRate: settings.defaultTaxRate,
      subtotal: 0, taxAmount: 0, total: 0,
      paidAmount: 0, balance: 0, paymentMethod: 'transferencia',
      status: 'pendiente', notes: '',
      items: [], payments: [],
      issuedAt: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    });
    setIsNew(true);
  }

  function openEdit(r: Receipt) {
    setEditing({ ...r, items: r.items.map(i => ({ ...i })), payments: r.payments.map(p => ({ ...p })) });
    setIsNew(false);
  }

  function recalc(r: Receipt): Receipt {
    const subtotal = r.items.reduce((s, i) => s + i.lineTotal, 0);
    const taxAmount = r.applyTax ? subtotal * (r.taxRate / 100) : 0;
    const total = subtotal + taxAmount;
    const paidAmount = r.payments.reduce((s, p) => s + p.amount, 0);
    const balance = total - paidAmount;
    const status: Receipt['status'] = balance <= 0 ? 'pagado' : paidAmount > 0 ? 'parcial' : 'pendiente';
    return { ...r, subtotal, taxAmount, total, paidAmount, balance, status };
  }

  function addItem() {
    if (!editing) return;
    const newItem: ReceiptItem = { id: genId(), description: '', quantity: 1, unit: 'pza', unitPrice: 0, lineTotal: 0 };
    setEditing(recalc({ ...editing, items: [...editing.items, newItem] }));
  }

  function updateItem(idx: number, changes: Partial<ReceiptItem>) {
    if (!editing) return;
    const items = editing.items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, ...changes };
      updated.lineTotal = updated.quantity * updated.unitPrice;
      return updated;
    });
    setEditing(recalc({ ...editing, items }));
  }

  function removeItem(idx: number) {
    if (!editing) return;
    setEditing(recalc({ ...editing, items: editing.items.filter((_, i) => i !== idx) }));
  }

  function loadFromQuote(quoteId: string) {
    if (!editing) return;
    const q = quotes.find(x => x.id === quoteId);
    if (!q) return;
    const items: ReceiptItem[] = q.items.map(i => ({
      id: genId(), description: i.description, quantity: i.quantity,
      unit: i.unit, unitPrice: i.unitPrice, lineTotal: i.lineTotal,
    }));
    setEditing(recalc({
      ...editing, quoteId, clientId: q.clientId, clientName: q.clientName,
      applyTax: q.applyTax, taxRate: q.taxRate, items,
    }));
  }

  function addPayment() {
    if (!editing) return;
    const payment: ReceiptPayment = { id: genId(), amount: editing.balance, method: 'transferencia', note: '', paidAt: new Date().toISOString().slice(0, 10) };
    setEditing(recalc({ ...editing, payments: [...editing.payments, payment] }));
  }

  function updatePayment(idx: number, changes: Partial<ReceiptPayment>) {
    if (!editing) return;
    const payments = editing.payments.map((p, i) => i === idx ? { ...p, ...changes } : p);
    setEditing(recalc({ ...editing, payments }));
  }

  function removePayment(idx: number) {
    if (!editing) return;
    setEditing(recalc({ ...editing, payments: editing.payments.filter((_, i) => i !== idx) }));
  }

  function handleSave() {
    if (!editing) return;
    const r = recalc(editing);
    if (isNew) {
      onChange([r, ...receipts]);
    } else {
      onChange(receipts.map((x) => (x.id === r.id ? r : x)));
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar esta venta?')) {
      onChange(receipts.filter((r) => r.id !== id));
      setEditing(null);
    }
  }

  const statusColors: Record<string, string> = {
    pendiente: 'bg-amber-50 text-amber-700',
    parcial: 'bg-sky-50 text-sky-700',
    pagado: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className="space-y-4 view-enter">
      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ventas..." className="input-field pl-10" />
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card-base p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay ventas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="card-base p-4 hover:border-blue-300 transition-all duration-200 cursor-pointer" onClick={() => openEdit(r)}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{r.receiptNumber}</p>
                    <span className={`status-badge ${statusColors[r.status] || ''}`}>{r.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{r.clientName || 'Sin cliente'}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-gray-900">{fmt(r.total)}</p>
                  <button onClick={(e) => { e.stopPropagation(); onPrint(r); }} className="mt-1 p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Imprimir">
                    <Printer className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
          <div className="card-base w-full max-w-2xl my-8 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{isNew ? 'Nueva venta' : 'Editar venta'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block"># PO / Venta</label>
                <input value={editing.receiptNumber} onChange={(e) => setEditing({ ...editing, receiptNumber: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Fecha emisión</label>
                <input type="date" value={editing.issuedAt} onChange={(e) => setEditing({ ...editing, issuedAt: e.target.value })} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Cliente</label>
                <div className="relative">
                  <select
                    value={editing.clientId}
                    onChange={(e) => {
                      const cl = clients.find(c => c.id === e.target.value);
                      setEditing({ ...editing, clientId: e.target.value, clientName: cl?.fullName || '' });
                    }}
                    className="input-field appearance-none pr-8"
                  >
                    <option value="">Seleccionar...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Desde cotización</label>
                <div className="relative">
                  <select
                    value={editing.quoteId}
                    onChange={(e) => loadFromQuote(e.target.value)}
                    className="input-field appearance-none pr-8"
                  >
                    <option value="">Ninguna</option>
                    {quotes.map(q => <option key={q.id} value={q.id}>{q.quoteNumber} - {q.title}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Tax controls */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={editing.applyTax} onChange={(e) => setEditing(recalc({ ...editing, applyTax: e.target.checked }))} className="rounded border-gray-300" />
                Aplicar IVA
              </label>
              {editing.applyTax && (
                <div className="flex items-center gap-1">
                  <input type="number" value={editing.taxRate} onChange={(e) => setEditing(recalc({ ...editing, taxRate: Number(e.target.value) }))} className="input-field w-20 text-center" />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500 font-medium">Conceptos</label>
                <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Agregar</button>
              </div>
              <div className="space-y-2">
                {editing.items.map((item, idx) => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <input value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })} className="input-field text-xs" placeholder="Descripción" />
                    <div className="grid grid-cols-4 gap-2">
                      <input type="number" value={item.quantity || ''} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} className="input-field text-xs" placeholder="Cant" />
                      <input value={item.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} className="input-field text-xs" placeholder="Unidad" />
                      <input type="number" value={item.unitPrice || ''} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })} className="input-field text-xs" placeholder="P.U." />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">{fmt(item.lineTotal)}</span>
                        <button onClick={() => removeItem(idx)} className="p-1 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-3 space-y-1 text-right">
              <p className="text-sm text-gray-600">Subtotal: <span className="font-semibold text-gray-900">{fmt(editing.subtotal)}</span></p>
              {editing.applyTax && (
                <p className="text-sm text-gray-600">IVA ({editing.taxRate}%): <span className="font-semibold text-gray-900">{fmt(editing.taxAmount)}</span></p>
              )}
              <p className="text-base font-bold text-gray-900">Total: {fmt(editing.total)}</p>
            </div>

            {/* Payments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Pagos
                </label>
                <button onClick={addPayment} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">+ Registrar pago</button>
              </div>
              <div className="space-y-2">
                {editing.payments.map((p, idx) => (
                  <div key={p.id} className="bg-emerald-50/50 rounded-xl p-3">
                    <div className="grid grid-cols-4 gap-2">
                      <input type="number" value={p.amount || ''} onChange={(e) => updatePayment(idx, { amount: Number(e.target.value) })} className="input-field text-xs" placeholder="Monto" />
                      <input value={p.method} onChange={(e) => updatePayment(idx, { method: e.target.value })} className="input-field text-xs" placeholder="Método" />
                      <input type="date" value={p.paidAt} onChange={(e) => updatePayment(idx, { paidAt: e.target.value })} className="input-field text-xs" />
                      <div className="flex items-center justify-end">
                        <button onClick={() => removePayment(idx)} className="p-1 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <input value={p.note} onChange={(e) => updatePayment(idx, { note: e.target.value })} className="input-field text-xs mt-2" placeholder="Nota del pago" />
                  </div>
                ))}
              </div>
              {editing.payments.length > 0 && (
                <div className="mt-2 text-right space-y-1">
                  <p className="text-sm text-emerald-700">Pagado: <span className="font-semibold">{fmt(editing.paidAmount)}</span></p>
                  <p className="text-sm text-amber-700">Saldo: <span className="font-semibold">{fmt(editing.balance)}</span></p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Notas</label>
              <textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} className="input-field min-h-[60px] resize-none" />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
              {!isNew && (
                <>
                  <button onClick={() => { handleSave(); onPrint(recalc(editing)); }} className="btn-secondary flex items-center gap-2">
                    <Printer className="w-4 h-4" /> PDF
                  </button>
                  <button onClick={() => handleDelete(editing.id)} className="btn-danger flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
