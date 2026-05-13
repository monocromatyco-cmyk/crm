import { useState } from 'react';
import { Quote, QuoteItem, Client, Service, Settings } from '../types';
import { genId } from '../store';
import { Search, Plus, FileText, X, Trash2, Printer, ChevronDown } from 'lucide-react';

interface Props {
  quotes: Quote[];
  clients: Client[];
  services: Service[];
  settings: Settings;
  onChange: (quotes: Quote[]) => void;
  onPrint: (quote: Quote) => void;
}

export default function QuotesView({ quotes, clients, services, settings, onChange, onPrint }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Quote | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: settings.currency }).format(n);

  const filtered = quotes.filter((q) => {
    const s = search.toLowerCase();
    return q.quoteNumber.toLowerCase().includes(s) || q.title.toLowerCase().includes(s) || q.clientName.toLowerCase().includes(s);
  });

  function nextQuoteNumber() {
    const max = quotes.reduce((m, q) => {
      const num = parseInt(q.quoteNumber.replace(/\D/g, '')) || 0;
      return num > m ? num : m;
    }, 0);
    return `COT-${String(max + 1).padStart(4, '0')}`;
  }

  function openNew() {
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);
    setEditing({
      id: genId(), quoteNumber: nextQuoteNumber(), clientId: '', clientName: '',
      title: '', status: 'borrador', currency: settings.currency,
      applyTax: true, taxRate: settings.defaultTaxRate,
      subtotal: 0, taxAmount: 0, total: 0,
      validUntil: validDate.toISOString().slice(0, 10),
      notes: '', items: [], createdAt: new Date().toISOString(),
    });
    setIsNew(true);
  }

  function openEdit(q: Quote) {
    setEditing({ ...q, items: q.items.map(i => ({ ...i })) });
    setIsNew(false);
  }

  function recalc(q: Quote): Quote {
    const subtotal = q.items.reduce((s, i) => s + i.lineTotal, 0);
    const taxAmount = q.applyTax ? subtotal * (q.taxRate / 100) : 0;
    return { ...q, subtotal, taxAmount, total: subtotal + taxAmount };
  }

  function addItem() {
    if (!editing) return;
    const newItem: QuoteItem = { id: genId(), description: '', quantity: 1, unit: 'pza', unitPrice: 0, lineTotal: 0 };
    setEditing(recalc({ ...editing, items: [...editing.items, newItem] }));
  }

  function updateItem(idx: number, changes: Partial<QuoteItem>) {
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

  function addFromService(svc: Service) {
    if (!editing) return;
    const newItem: QuoteItem = { id: genId(), description: svc.name, quantity: 1, unit: svc.unit, unitPrice: svc.basePrice, lineTotal: svc.basePrice };
    setEditing(recalc({ ...editing, items: [...editing.items, newItem] }));
  }

  function handleSave() {
    if (!editing) return;
    const q = recalc(editing);
    if (isNew) {
      onChange([q, ...quotes]);
    } else {
      onChange(quotes.map((x) => (x.id === q.id ? q : x)));
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar esta cotización?')) {
      onChange(quotes.filter((q) => q.id !== id));
      setEditing(null);
    }
  }

  const statusColors: Record<string, string> = {
    borrador: 'bg-gray-100 text-gray-600',
    enviada: 'bg-sky-50 text-sky-700',
    aceptada: 'bg-emerald-50 text-emerald-700',
    rechazada: 'bg-red-50 text-red-700',
  };

  return (
    <div className="space-y-4 view-enter">
      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cotizaciones..." className="input-field pl-10" />
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card-base p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay cotizaciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <div key={q.id} className="card-base p-4 hover:border-blue-300 transition-all duration-200 cursor-pointer" onClick={() => openEdit(q)}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{q.quoteNumber}</p>
                    <span className={`status-badge ${statusColors[q.status] || ''}`}>{q.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{q.title || 'Sin título'} · {q.clientName || 'Sin cliente'}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-gray-900">{fmt(q.total)}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); onPrint(q); }}
                    className="mt-1 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Imprimir"
                  >
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
              <h2 className="text-lg font-bold text-gray-900">{isNew ? 'Nueva cotización' : 'Editar cotización'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block"># Cotización</label>
                <input value={editing.quoteNumber} onChange={(e) => setEditing({ ...editing, quoteNumber: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Estado</label>
                <div className="relative">
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as Quote['status'] })}
                    className="input-field appearance-none pr-8"
                  >
                    <option value="borrador">Borrador</option>
                    <option value="enviada">Enviada</option>
                    <option value="aceptada">Aceptada</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Título</label>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input-field" placeholder="Propuesta de diseño web" />
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
                <label className="text-xs text-gray-500 font-medium mb-1 block">Vigencia</label>
                <input type="date" value={editing.validUntil} onChange={(e) => setEditing({ ...editing, validUntil: e.target.value })} className="input-field" />
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
                <div className="flex gap-2">
                  {services.length > 0 && (
                    <div className="relative group">
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Desde servicio</button>
                      <div className="absolute right-0 top-full mt-1 w-48 card-base p-1 hidden group-hover:block z-10 shadow-lg">
                        {services.map(svc => (
                          <button key={svc.id} onClick={() => addFromService(svc)} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg">
                            {svc.name} · {fmt(svc.basePrice)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Agregar</button>
                </div>
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
