import { useState } from 'react';
import { Receipt as ReceiptType, ReceiptItem, ReceiptPayment, Client, Quote, Settings } from '../types';
import { genId } from '../store';
import { Search, Plus, ShoppingCart, X, Trash2, Plus as PlusIcon, ChevronRight, Eye, Mail, CreditCard, Package } from 'lucide-react';
import PrintDocument from './PrintDocument';

interface Props {
  receipts: ReceiptType[];
  clients: Client[];
  quotes: Quote[];
  settings: Settings;
  onChange: (receipts: ReceiptType[]) => void;
}

function emptyItem(): ReceiptItem {
  return { id: genId(), description: '', quantity: 1, unit: 'servicio', unitPrice: 0, lineTotal: 0 };
}

export default function ReceiptsView({ receipts, clients, quotes, settings, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ReceiptType | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [previewing, setPreviewing] = useState<ReceiptType | null>(null);

  const { currency, defaultTaxRate: taxRate } = settings;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n);

  const filtered = receipts.filter((r) => {
    const s = search.toLowerCase();
    return r.receiptNumber.toLowerCase().includes(s) || r.clientName.toLowerCase().includes(s);
  });

  const statusColor: Record<string, string> = {
    pendiente: 'bg-amber-500/20 text-amber-400',
    parcial: 'bg-sky-500/20 text-sky-400',
    pagado: 'bg-emerald-500/20 text-emerald-400',
  };

  function nextNumber() {
    return `PO-${String(receipts.length + 1).padStart(4, '0')}`;
  }

  function recalc(r: ReceiptType): ReceiptType {
    const items = r.items.map((it) => ({ ...it, lineTotal: it.quantity * it.unitPrice }));
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const taxAmount = r.applyTax ? subtotal * (r.taxRate / 100) : 0;
    const total = subtotal + taxAmount;
    const paidAmount = r.payments.reduce((s, p) => s + p.amount, 0);
    const balance = total - paidAmount;
    const status: ReceiptType['status'] = balance <= 0 ? 'pagado' : paidAmount > 0 ? 'parcial' : 'pendiente';
    return { ...r, items, subtotal, taxAmount, total, paidAmount, balance: Math.max(0, balance), status };
  }

  function openNew() {
    setEditing({
      id: genId(), receiptNumber: nextNumber(), clientId: '', clientName: '',
      quoteId: '', currency, applyTax: false, taxRate,
      subtotal: 0, taxAmount: 0, total: 0, paidAmount: 0, balance: 0,
      paymentMethod: 'efectivo', status: 'pendiente', notes: '',
      items: [emptyItem()], payments: [],
      issuedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    });
    setIsNew(true);
  }

  function openEdit(r: ReceiptType) {
    setEditing({ ...r, items: r.items.map((i) => ({ ...i })), payments: r.payments.map((p) => ({ ...p })) });
    setIsNew(false);
  }

  function handleSave() {
    if (!editing) return;
    const final = recalc(editing);
    if (isNew) { onChange([final, ...receipts]); } else { onChange(receipts.map((r) => (r.id === final.id ? final : r))); }
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar esta PO / Venta?')) { onChange(receipts.filter((r) => r.id !== id)); setEditing(null); }
  }

  function updateItem(idx: number, patch: Partial<ReceiptItem>) {
    if (!editing) return;
    const items = [...editing.items]; items[idx] = { ...items[idx], ...patch };
    setEditing(recalc({ ...editing, items }));
  }

  function addItem() { if (!editing) return; setEditing({ ...editing, items: [...editing.items, emptyItem()] }); }

  function removeItem(idx: number) {
    if (!editing || editing.items.length <= 1) return;
    setEditing(recalc({ ...editing, items: editing.items.filter((_, i) => i !== idx) }));
  }

  function addPayment() {
    if (!editing) return;
    const p: ReceiptPayment = { id: genId(), amount: 0, method: 'transferencia', note: '', paidAt: new Date().toISOString() };
    setEditing(recalc({ ...editing, payments: [...editing.payments, p] }));
  }

  function updatePayment(idx: number, patch: Partial<ReceiptPayment>) {
    if (!editing) return;
    const payments = [...editing.payments]; payments[idx] = { ...payments[idx], ...patch };
    setEditing(recalc({ ...editing, payments }));
  }

  function removePayment(idx: number) {
    if (!editing) return;
    setEditing(recalc({ ...editing, payments: editing.payments.filter((_, i) => i !== idx) }));
  }

  function loadFromQuote(quoteId: string) {
    const q = quotes.find((qt) => qt.id === quoteId);
    if (!q || !editing) return;
    setEditing(recalc({
      ...editing, quoteId, clientId: q.clientId, clientName: q.clientName,
      applyTax: q.applyTax, taxRate: q.taxRate,
      items: q.items.map((i) => ({ ...i, id: genId() })),
    }));
  }

  function handleEmail(r: ReceiptType) {
    const client = clients.find((c) => c.id === r.clientId) || null;
    const clientEmail = client?.email || '';
    const businessName = settings.businessName || 'Órbita CRM';
    const itemsDetail = r.items
      .map((item, idx) => `  ${idx + 1}. ${item.description} — Cant: ${item.quantity} ${item.unit} — P.U.: ${fmt(item.unitPrice)} — Total: ${fmt(item.lineTotal)}`)
      .join('\n');
    const today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const subject = encodeURIComponent(`Orden de Compra ${r.receiptNumber} — ${businessName}`);
    const body = encodeURIComponent(`Detalles de su orden ${r.receiptNumber}:\n\nFecha: ${today}\n\n${itemsDetail}\n\nSubtotal: ${fmt(r.subtotal)}\nTOTAL: ${fmt(r.total)}\n\nSaludos,\n${businessName}`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${subject}&body=${body}`, '_blank');
  }

  return (
    <div className="space-y-4 view-enter">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ventas..." className="input-field pl-10" />
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No hay PO / Ventas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="glass-card p-4 hover:border-blue-500/30 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="cursor-pointer flex-1 min-w-0" onClick={() => openEdit(r)}>
                  <p className="text-sm font-semibold text-slate-200 truncate">{r.receiptNumber}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.clientName || 'Sin cliente'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-200">{fmt(r.total)}</p>
                    <span className={`status-badge text-[10px] ${statusColor[r.status] || ''}`}>{r.status}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setPreviewing(r)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Vista previa"><Eye className="w-4 h-4 text-slate-400" /></button>
                    <button onClick={() => handleEmail(r)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Email"><Mail className="w-4 h-4 text-slate-400" /></button>
                    <button onClick={() => openEdit(r)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Print Preview */}
      {previewing && (
        <PrintDocument
          type="venta"
          docNumber={previewing.receiptNumber}
          client={clients.find((c) => c.id === previewing.clientId) || null}
          items={previewing.items}
          subtotal={previewing.subtotal}
          applyTax={previewing.applyTax}
          taxRate={previewing.taxRate}
          taxAmount={previewing.taxAmount}
          total={previewing.total}
          notes={previewing.notes}
          status={previewing.status}
          settings={settings}
          onClose={() => setPreviewing(null)}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
          <div className="glass-card w-full max-w-2xl my-8 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{isNew ? 'Nueva PO / Venta' : 'Editar PO / Venta'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Número</label>
                <input value={editing.receiptNumber} onChange={(e) => setEditing({ ...editing, receiptNumber: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Desde cotización</label>
                <select value={editing.quoteId} onChange={(e) => loadFromQuote(e.target.value)} className="input-field">
                  <option value="">Ninguna</option>
                  {quotes.map((q) => <option key={q.id} value={q.id}>{q.quoteNumber} — {q.title}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Cliente</label>
                <select
                  value={editing.clientId}
                  onChange={(e) => {
                    const c = clients.find((cl) => cl.id === e.target.value);
                    setEditing({ ...editing, clientId: e.target.value, clientName: c?.fullName || '' });
                  }}
                  className="input-field"
                >
                  <option value="">Sin cliente</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={editing.applyTax} onChange={(e) => setEditing(recalc({ ...editing, applyTax: e.target.checked }))} className="accent-blue-500 w-4 h-4" />
                  IVA
                </label>
                {editing.applyTax && (
                  <input type="number" value={editing.taxRate} onChange={(e) => setEditing(recalc({ ...editing, taxRate: Number(e.target.value) }))} className="input-field w-16 text-xs" placeholder="%" />
                )}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Package className="w-4 h-4" /> Conceptos</h3>
                <button onClick={addItem} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"><PlusIcon className="w-3 h-3" /> Agregar</button>
              </div>
              <div className="space-y-2">
                {editing.items.map((item, idx) => (
                  <div key={item.id} className="glass-card-light p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })} placeholder="Descripción" className="input-field text-xs flex-1" />
                      {editing.items.length > 1 && (
                        <button onClick={() => removeItem(idx)} className="p-1.5 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <input type="number" value={item.quantity || ''} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} className="input-field text-xs" placeholder="Cant." />
                      <input value={item.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} className="input-field text-xs" placeholder="Unidad" />
                      <input type="number" value={item.unitPrice || ''} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })} className="input-field text-xs" placeholder="Precio" />
                      <div className="flex items-center justify-end text-sm font-semibold text-blue-400">{fmt(item.quantity * item.unitPrice)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="glass-card-light p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="text-slate-200">{fmt(editing.subtotal)}</span></div>
              {editing.applyTax && <div className="flex justify-between text-slate-400"><span>IVA ({editing.taxRate}%)</span><span className="text-slate-200">{fmt(editing.taxAmount)}</span></div>}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700"><span className="text-white">Total</span><span className="text-blue-400">{fmt(editing.total)}</span></div>
              <div className="border-t border-slate-700 pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-emerald-400"><span>Pagado</span><span>{fmt(editing.paidAmount)}</span></div>
                <div className="flex justify-between text-amber-400 font-bold"><span>Saldo</span><span>{fmt(editing.balance)}</span></div>
              </div>
            </div>

            {/* Payments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Pagos</h3>
                <button onClick={addPayment} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"><PlusIcon className="w-3 h-3" /> Agregar pago</button>
              </div>
              <div className="space-y-2">
                {editing.payments.map((p, idx) => (
                  <div key={p.id} className="glass-card-light p-3 flex items-center gap-2">
                    <input type="number" value={p.amount || ''} onChange={(e) => updatePayment(idx, { amount: Number(e.target.value) })} className="input-field text-xs w-28" placeholder="Monto" />
                    <select value={p.method} onChange={(e) => updatePayment(idx, { method: e.target.value })} className="input-field text-xs flex-1">
                      <option value="transferencia">Transferencia</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="cheque">Cheque</option>
                      <option value="otro">Otro</option>
                    </select>
                    <input value={p.note} onChange={(e) => updatePayment(idx, { note: e.target.value })} className="input-field text-xs flex-1" placeholder="Nota" />
                    <button onClick={() => removePayment(idx)} className="p-1.5 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Notas</label>
              <textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} className="input-field min-h-[60px] resize-none" />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
              {!isNew && (
                <>
                  <button onClick={() => setPreviewing(editing)} className="btn-secondary flex items-center gap-1"><Eye className="w-4 h-4" /> Vista previa</button>
                  <button onClick={() => handleDelete(editing.id)} className="btn-danger flex items-center gap-1"><Trash2 className="w-4 h-4" /></button>
                </>
              )}
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
