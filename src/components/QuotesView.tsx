import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, FileText, PlusCircle, MinusCircle, Printer } from 'lucide-react';
import { Quote, QuoteItem, Client, Service, Settings } from '../types';
import { genId } from '../store';
import PrintDocument from './PrintDocument';

interface Props {
  quotes: Quote[];
  clients: Client[];
  services: Service[];
  settings: Settings;
  onChange: (quotes: Quote[]) => void;
}

function emptyItem(): QuoteItem {
  return { id: genId(), description: '', quantity: 1, unit: 'pza', unitPrice: 0, lineTotal: 0 };
}

export default function QuotesView({ quotes, clients, services, settings, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Quote | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [printing, setPrinting] = useState<Quote | null>(null);

  const { currency, defaultTaxRate: taxRate } = settings;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n);

  const filtered = quotes.filter((q) => {
    const s = search.toLowerCase();
    return q.title.toLowerCase().includes(s) || q.clientName.toLowerCase().includes(s) || q.quoteNumber.toLowerCase().includes(s);
  });

  const statusColor: Record<string, string> = {
    borrador: 'bg-slate-500',
    enviada: 'bg-sky-500',
    aceptada: 'bg-emerald-500',
    rechazada: 'bg-red-500',
  };

  function nextNumber() {
    return `COT-${String(quotes.length + 1).padStart(4, '0')}`;
  }

  function recalc(q: Quote): Quote {
    const items = q.items.map((it) => ({ ...it, lineTotal: it.quantity * it.unitPrice }));
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const taxAmount = q.applyTax ? subtotal * (q.taxRate / 100) : 0;
    return { ...q, items, subtotal, taxAmount, total: subtotal + taxAmount };
  }

  function openNew() {
    const q: Quote = {
      id: genId(),
      quoteNumber: nextNumber(),
      clientId: '',
      clientName: '',
      title: '',
      status: 'borrador',
      currency,
      applyTax: false,
      taxRate,
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      validUntil: '',
      notes: '',
      items: [emptyItem()],
      createdAt: new Date().toISOString(),
    };
    setEditing(q);
    setIsNew(true);
  }

  function openEdit(q: Quote) {
    setEditing({ ...q, items: q.items.map((i) => ({ ...i })) });
    setIsNew(false);
  }

  function handleSave() {
    if (!editing || !editing.title.trim()) return;
    const final = recalc(editing);
    if (isNew) {
      onChange([final, ...quotes]);
    } else {
      onChange(quotes.map((q) => (q.id === final.id ? final : q)));
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar esta cotización?')) {
      onChange(quotes.filter((q) => q.id !== id));
    }
  }

  function updateItem(idx: number, patch: Partial<QuoteItem>) {
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

  function selectService(idx: number, serviceId: string) {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    updateItem(idx, { description: svc.name, unitPrice: svc.basePrice, unit: svc.unit });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cotizaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Nueva cotización
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay cotizaciones</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((q) => (
            <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-slate-800">{q.title}</p>
                <p className="text-xs text-slate-500">{q.clientName || 'Sin cliente'} · {q.quoteNumber}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm text-slate-700">{fmt(q.total)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[q.status]} text-white`}>{q.status}</span>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setPrinting(q)} className="p-2 hover:bg-blue-50 rounded-lg transition" title="Imprimir / PDF">
                  <Printer className="w-4 h-4 text-blue-500" />
                </button>
                <button onClick={() => openEdit(q)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <Edit2 className="w-4 h-4 text-slate-400" />
                </button>
                <button onClick={() => handleDelete(q.id)} className="p-2 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl my-8 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">{isNew ? 'Nueva cotización' : 'Editar cotización'}</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-slate-500 mb-1 block">Título *</span>
                  <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input-field" />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500 mb-1 block">Número</span>
                  <input value={editing.quoteNumber} onChange={(e) => setEditing({ ...editing, quoteNumber: e.target.value })} className="input-field" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-slate-500 mb-1 block">Cliente</span>
                  <select
                    value={editing.clientId}
                    onChange={(e) => {
                      const cl = clients.find((c) => c.id === e.target.value);
                      setEditing({ ...editing, clientId: e.target.value, clientName: cl?.fullName || '' });
                    }}
                    className="input-field"
                  >
                    <option value="">Sin cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500 mb-1 block">Estado</span>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as Quote['status'] })}
                    className="input-field"
                  >
                    <option value="borrador">Borrador</option>
                    <option value="enviada">Enviada</option>
                    <option value="aceptada">Aceptada</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-slate-500 mb-1 block">Válida hasta</span>
                  <input type="date" value={editing.validUntil} onChange={(e) => setEditing({ ...editing, validUntil: e.target.value })} className="input-field" />
                </label>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.applyTax}
                      onChange={(e) => setEditing(recalc({ ...editing, applyTax: e.target.checked }))}
                      className="accent-blue-500 w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">Aplicar IVA</span>
                  </label>
                  {editing.applyTax && (
                    <label className="block">
                      <span className="text-xs text-slate-500 mb-1 block">%</span>
                      <input
                        type="number"
                        value={editing.taxRate}
                        onChange={(e) => setEditing(recalc({ ...editing, taxRate: Number(e.target.value) }))}
                        className="input-field w-20"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Conceptos</span>
                  <button onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500">
                    <PlusCircle className="w-4 h-4" /> Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {editing.items.map((item, idx) => (
                    <div key={item.id} className="bg-slate-50 rounded-lg p-3 space-y-2">
                      <div className="flex gap-2">
                        <select
                          className="input-field text-xs flex-1"
                          onChange={(e) => selectService(idx, e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>Seleccionar servicio...</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>{s.name} — {fmt(s.basePrice)}</option>
                          ))}
                        </select>
                        {editing.items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-500">
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                        placeholder="Descripción"
                        className="input-field text-xs"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} className="input-field text-xs" placeholder="Cant." />
                        <input value={item.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} className="input-field text-xs" placeholder="Unidad" />
                        <input type="number" min={0} step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })} className="input-field text-xs" placeholder="Precio" />
                        <div className="text-right text-xs font-semibold text-emerald-600 flex items-center justify-end">
                          {fmt(item.quantity * item.unitPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="text-slate-700">{fmt(editing.subtotal)}</span></div>
                {editing.applyTax && (
                  <div className="flex justify-between"><span className="text-slate-500">IVA ({editing.taxRate}%)</span><span className="text-slate-700">{fmt(editing.taxAmount)}</span></div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-slate-200 pt-2 mt-2">
                  <span className="text-slate-800">Total</span><span className="text-blue-600">{fmt(editing.total)}</span>
                </div>
              </div>

              <label className="block">
                <span className="text-xs text-slate-500 mb-1 block">Notas</span>
                <textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} className="input-field resize-none" rows={2} />
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print modal */}
      {printing && (
        <PrintDocument
          type="cotizacion"
          docNumber={printing.quoteNumber}
          title={printing.title}
          client={clients.find((c) => c.id === printing.clientId) || null}
          items={printing.items}
          subtotal={printing.subtotal}
          applyTax={printing.applyTax}
          taxRate={printing.taxRate}
          taxAmount={printing.taxAmount}
          total={printing.total}
          notes={printing.notes}
          validUntil={printing.validUntil}
          settings={settings}
          onClose={() => setPrinting(null)}
        />
      )}
    </div>
  );
}
