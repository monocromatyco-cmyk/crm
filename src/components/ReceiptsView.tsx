import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, ShoppingCart, PlusCircle, MinusCircle, Printer, Mail } from 'lucide-react';
import { Receipt as ReceiptType, ReceiptItem, ReceiptPayment, Client, Quote, Settings } from '../types';
import { genId } from '../store';
import PrintDocument from './PrintDocument';

interface Props {
  receipts: ReceiptType[];
  clients: Client[];
  quotes: Quote[];
  settings: Settings;
  onChange: (receipts: ReceiptType[]) => void;
}

function emptyItem(): ReceiptItem {
  return { id: genId(), description: '', quantity: 1, unit: 'pza', unitPrice: 0, lineTotal: 0 };
}

export default function ReceiptsView({ receipts, clients, quotes, settings, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ReceiptType | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [printing, setPrinting] = useState<ReceiptType | null>(null);

  const { currency, defaultTaxRate: taxRate } = settings;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n);

  const filtered = receipts.filter((r) => {
    const s = search.toLowerCase();
    return r.receiptNumber.toLowerCase().includes(s) || r.clientName.toLowerCase().includes(s);
  });

  const statusColor: Record<string, string> = {
    pendiente: 'bg-amber-500',
    parcial: 'bg-sky-500',
    pagado: 'bg-emerald-500',
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
    const r: ReceiptType = {
      id: genId(),
      receiptNumber: nextNumber(),
      clientId: '',
      clientName: '',
      quoteId: '',
      currency,
      applyTax: false,
      taxRate,
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      paidAmount: 0,
      balance: 0,
      paymentMethod: 'efectivo',
      status: 'pendiente',
      notes: '',
      items: [emptyItem()],
      payments: [],
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setEditing(r);
    setIsNew(true);
  }

  function openEdit(r: ReceiptType) {
    setEditing({
      ...r,
      items: r.items.map((i) => ({ ...i })),
      payments: r.payments.map((p) => ({ ...p })),
    });
    setIsNew(false);
  }

  function handleSave() {
    if (!editing) return;
    const final = recalc(editing);
    if (isNew) {
      onChange([final, ...receipts]);
    } else {
      onChange(receipts.map((r) => (r.id === final.id ? final : r)));
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar esta PO / Venta?')) {
      onChange(receipts.filter((r) => r.id !== id));
    }
  }

  function updateItem(idx: number, patch: Partial<ReceiptItem>) {
    if (!editing) return;
    const items = [...editing.items];
    items[idx] = { ...items[idx], ...patch };
    setEditing(recalc({ ...editing, items }));
  }

  function addItem() {
    if (!editing) return;
    setEditing({ ...editing, items: [...editing.items, emptyItem()] });
  }

  function removeItem(idx: number) {
    if (!editing || editing.items.length <= 1) return;
    const items = editing.items.filter((_, i) => i !== idx);
    setEditing(recalc({ ...editing, items }));
  }

  function addPayment() {
    if (!editing) return;
    const p: ReceiptPayment = { id: genId(), amount: 0, method: 'transferencia', note: '', paidAt: new Date().toISOString() };
    setEditing(recalc({ ...editing, payments: [...editing.payments, p] }));
  }

  function updatePayment(idx: number, patch: Partial<ReceiptPayment>) {
    if (!editing) return;
    const payments = [...editing.payments];
    payments[idx] = { ...payments[idx], ...patch };
    setEditing(recalc({ ...editing, payments }));
  }

  function removePayment(idx: number) {
    if (!editing) return;
    const payments = editing.payments.filter((_, i) => i !== idx);
    setEditing(recalc({ ...editing, payments }));
  }

  function loadFromQuote(quoteId: string) {
    const q = quotes.find((qt) => qt.id === quoteId);
    if (!q || !editing) return;
    setEditing(recalc({
      ...editing,
      quoteId,
      clientId: q.clientId,
      clientName: q.clientName,
      applyTax: q.applyTax,
      taxRate: q.taxRate,
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
    const body = encodeURIComponent(
`Estimado/a ${client?.fullName || 'cliente'},

Agradecemos sinceramente su solicitud. Es un placer atenderle.

A continuación le compartimos los detalles de su orden de compra ${r.receiptNumber}:

Fecha: ${today}

─────────────────────────────────
DETALLE DE CONCEPTOS:
─────────────────────────────────
${itemsDetail}

─────────────────────────────────
Subtotal: ${fmt(r.subtotal)}${r.applyTax ? `\nIVA (${r.taxRate}%): ${fmt(r.taxAmount)}` : ''}
TOTAL: ${fmt(r.total)}
─────────────────────────────────

${r.notes ? `Notas: ${r.notes}\n` : ''}${settings.bankName ? `\nDatos bancarios:\nBanco: ${settings.bankName}${settings.bankAccount ? `\nCuenta: ${settings.bankAccount}` : ''}${settings.bankClabe ? `\nCLABE: ${settings.bankClabe}` : ''}${settings.bankBeneficiary ? `\nBeneficiario: ${settings.bankBeneficiary}` : ''}` : ''}

Quedamos a sus órdenes para cualquier duda o aclaración.

Saludos cordiales,
${businessName}${settings.phone ? `\nTel: ${settings.phone}` : ''}${settings.email ? `\nEmail: ${settings.email}` : ''}`
    );

    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${subject}&body=${body}`, '_blank');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar PO / Ventas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Nueva PO
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay PO / Ventas</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-slate-800">{r.receiptNumber}</p>
                <p className="text-xs text-slate-500">{r.clientName || 'Sin cliente'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm text-slate-700">{fmt(r.total)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[r.status]} text-white`}>
                  {r.status}
                </span>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => handleEmail(r)} className="p-2 hover:bg-emerald-50 rounded-lg transition" title="Enviar por email">
                  <Mail className="w-4 h-4 text-emerald-500" />
                </button>
                <button onClick={() => setPrinting(r)} className="p-2 hover:bg-blue-50 rounded-lg transition" title="Imprimir / PDF">
                  <Printer className="w-4 h-4 text-blue-500" />
                </button>
                <button onClick={() => openEdit(r)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <Edit2 className="w-4 h-4 text-slate-400" />
                </button>
                <button onClick={() => handleDelete(r.id)} className="p-2 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="font-bold text-lg text-slate-800">{isNew ? 'Nueva PO / Venta' : 'Editar PO / Venta'}</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
                  <input value={editing.receiptNumber} onChange={(e) => setEditing({ ...editing, receiptNumber: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Desde cotización</label>
                  <select
                    value={editing.quoteId}
                    onChange={(e) => loadFromQuote(e.target.value)}
                    className="input-field"
                  >
                    <option value="">— Ninguna —</option>
                    {quotes.map((q) => (
                      <option key={q.id} value={q.id}>{q.quoteNumber} - {q.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cliente</label>
                  <select
                    value={editing.clientId}
                    onChange={(e) => {
                      const c = clients.find((cl) => cl.id === e.target.value);
                      setEditing({ ...editing, clientId: e.target.value, clientName: c?.fullName || '' });
                    }}
                    className="input-field"
                  >
                    <option value="">— Sin cliente —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.applyTax}
                      onChange={(e) => setEditing(recalc({ ...editing, applyTax: e.target.checked }))}
                      className="accent-blue-500 w-4 h-4"
                    />
                    IVA
                  </label>
                  {editing.applyTax && (
                    <input
                      type="number"
                      value={editing.taxRate}
                      onChange={(e) => setEditing(recalc({ ...editing, taxRate: Number(e.target.value) }))}
                      className="input-field w-20 text-xs"
                      placeholder="%"
                    />
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-700">Conceptos</span>
                  <button onClick={addItem} className="flex items-center gap-1 text-blue-600 text-xs font-medium hover:text-blue-500">
                    <PlusCircle className="w-4 h-4" /> Agregar
                  </button>
                </div>
                <div className="space-y-3">
                  {editing.items.map((item, idx) => (
                    <div key={item.id} className="bg-slate-50 rounded-lg p-3 space-y-2">
                      <div className="flex gap-2 items-center">
                        <input
                          value={item.description}
                          onChange={(e) => updateItem(idx, { description: e.target.value })}
                          placeholder="Descripción"
                          className="input-field text-xs flex-1"
                        />
                        {editing.items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-500">
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} className="input-field text-xs" />
                        <input value={item.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} className="input-field text-xs" />
                        <input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })} className="input-field text-xs" />
                        <div className="flex items-center justify-end text-sm font-medium text-slate-700">
                          {fmt(item.quantity * item.unitPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-600">Subtotal</span><span className="font-medium">{fmt(editing.subtotal)}</span></div>
                {editing.applyTax && (
                  <div className="flex justify-between text-sm"><span className="text-slate-600">IVA ({editing.taxRate}%)</span><span className="font-medium">{fmt(editing.taxAmount)}</span></div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2"><span>Total</span><span className="text-blue-600">{fmt(editing.total)}</span></div>
                <div className="border-t border-slate-200 pt-2 mt-2" />
                <div className="flex justify-between text-sm"><span className="text-slate-600">Pagado</span><span className="font-medium text-emerald-600">{fmt(editing.paidAmount)}</span></div>
                <div className="flex justify-between text-sm font-bold"><span className="text-slate-600">Saldo</span><span className="text-amber-600">{fmt(editing.balance)}</span></div>
              </div>

              {/* Payments */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-700">Pagos</span>
                  <button onClick={addPayment} className="flex items-center gap-1 text-emerald-600 text-xs font-medium hover:text-emerald-500">
                    <PlusCircle className="w-4 h-4" /> Agregar pago
                  </button>
                </div>
                <div className="space-y-2">
                  {editing.payments.map((p, idx) => (
                    <div key={p.id} className="flex gap-2 items-center bg-slate-50 rounded-lg p-2">
                      <input
                        type="number"
                        value={p.amount}
                        onChange={(e) => updatePayment(idx, { amount: Number(e.target.value) })}
                        className="input-field text-xs w-28"
                        placeholder="Monto"
                      />
                      <select
                        value={p.method}
                        onChange={(e) => updatePayment(idx, { method: e.target.value })}
                        className="input-field text-xs w-32"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="cheque">Cheque</option>
                        <option value="otro">Otro</option>
                      </select>
                      <input
                        value={p.note}
                        onChange={(e) => updatePayment(idx, { note: e.target.value })}
                        className="input-field text-xs flex-1"
                        placeholder="Nota"
                      />
                      <button onClick={() => removePayment(idx)} className="p-1 text-red-400 hover:text-red-500">
                        <MinusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notas</label>
                <textarea
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-200">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print */}
      {printing && (
        <PrintDocument
          type="venta"
          docNumber={printing.receiptNumber}
          client={clients.find((c) => c.id === printing.clientId) || null}
          items={printing.items}
          subtotal={printing.subtotal}
          applyTax={printing.applyTax}
          taxRate={printing.taxRate}
          taxAmount={printing.taxAmount}
          total={printing.total}
          notes={printing.notes}
          settings={settings}
          onClose={() => setPrinting(null)}
        />
      )}
    </div>
  );
}
