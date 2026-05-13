import { useState } from 'react';
import { Quote, QuoteItem, Client, Service, Settings } from '../types';
import { genId } from '../store';
import { Search, Plus, FileText, X, Trash2, Plus as PlusIcon, ChevronRight, Eye, Mail, Package } from 'lucide-react';
import PrintDocument from './PrintDocument';

interface Props {
  quotes: Quote[];
  clients: Client[];
  services: Service[];
  settings: Settings;
  onChange: (quotes: Quote[]) => void;
}

function emptyItem(): QuoteItem {
  return { id: genId(), description: '', quantity: 1, unit: 'servicio', unitPrice: 0, lineTotal: 0 };
}

export default function QuotesView({ quotes, clients, services, settings, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Quote | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [previewing, setPreviewing] = useState<Quote | null>(null);

  const { currency, defaultTaxRate: taxRate } = settings;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n);

  const filtered = quotes.filter((q) => {
    const s = search.toLowerCase();
    return q.title.toLowerCase().includes(s) || q.clientName.toLowerCase().includes(s) || q.quoteNumber.toLowerCase().includes(s);
  });

  const statusColor: Record<string, string> = {
    borrador: 'bg-slate-500/20 text-slate-400',
    enviada: 'bg-sky-500/20 text-sky-400',
    aceptada: 'bg-emerald-500/20 text-emerald-400',
    rechazada: 'bg-red-500/20 text-red-400',
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
    setEditing({
      id: genId(), quoteNumber: nextNumber(), clientId: '', clientName: '',
      title: '', status: 'borrador', currency, applyTax: false, taxRate,
      subtotal: 0, taxAmount: 0, total: 0, validUntil: '', notes: '',
      items: [emptyItem()], createdAt: new Date().toISOString(),
    });
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
      setEditing(null);
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

  function handleEmail(q: Quote) {
    const client = clients.find((c) => c.id === q.clientId) || null;
    const clientEmail = client?.email || '';
    const businessName = settings.businessName || 'Órbita CRM';

    const itemsDetail = q.items
      .map((item, idx) => `  ${idx + 1}. ${item.description} — Cant: ${item.quantity} ${item.unit} — P.U.: ${fmt(item.unitPrice)} — Total: ${fmt(item.lineTotal)}`)
      .join('\n');

    const today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    const subject = encodeURIComponent(`Cotización ${q.quoteNumber} — ${businessName}`);
    const body = encodeURIComponent(
`Estimado/a ${client?.fullName || 'cliente'},

A continuación los detalles de su cotización ${q.quoteNumber}:

${q.title ? `Concepto: ${q.title}\n` : ''}Fecha: ${today}
${q.validUntil ? `Válida hasta: ${q.validUntil}\n` : ''}
DETALLE:
${itemsDetail}

Subtotal: ${fmt(q.subtotal)}${q.applyTax ? `\nIVA (${q.taxRate}%): ${fmt(q.taxAmount)}` : ''}
TOTAL: ${fmt(q.total)}

Saludos,
${businessName}`
    );

    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${subject}&body=${body}`, '_blank');
  }

  return (
    <div className="space-y-4 view-enter">
      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cotizaciones..." className="input-field pl-10" />
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No hay cotizaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <div key={q.id} className="glass-card p-4 hover:border-blue-500/30 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="cursor-pointer flex-1 min-w-0" onClick={() => openEdit(q)}>
                  <p className="text-sm font-semibold text-slate-200 truncate">{q.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{q.clientName || 'Sin cliente'} · {q.quoteNumber}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-200">{fmt(q.total)}</p>
                    <span className={`status-badge text-[10px] ${statusColor[q.status] || ''}`}>{q.status}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setPreviewing(q)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Vista previa">
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                    <button onClick={() => handleEmail(q)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Enviar email">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </button>
                    <button onClick={() => openEdit(q)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
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
          type="cotizacion"
          docNumber={previewing.quoteNumber}
          title={previewing.title}
          client={clients.find((c) => c.id === previewing.clientId) || null}
          items={previewing.items}
          subtotal={previewing.subtotal}
          applyTax={previewing.applyTax}
          taxRate={previewing.taxRate}
          taxAmount={previewing.taxAmount}
          total={previewing.total}
          notes={previewing.notes}
          validUntil={previewing.validUntil}
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
              <h2 className="text-lg font-bold text-white">{isNew ? 'Nueva cotización' : 'Editar cotización'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Título *</label>
                <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Número</label>
                <input value={editing.quoteNumber} onChange={(e) => setEditing({ ...editing, quoteNumber: e.target.value })} className="input-field" />
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
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Estado</label>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Quote['status'] })} className="input-field">
                  <option value="borrador">Borrador</option>
                  <option value="enviada">Enviada</option>
                  <option value="aceptada">Aceptada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Válida hasta</label>
                <input type="date" value={editing.validUntil} onChange={(e) => setEditing({ ...editing, validUntil: e.target.value })} className="input-field" />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={editing.applyTax} onChange={(e) => setEditing(recalc({ ...editing, applyTax: e.target.checked }))} className="accent-blue-500 w-4 h-4" />
                  Aplicar IVA
                </label>
                {editing.applyTax && (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span>%</span>
                    <input type="number" value={editing.taxRate} onChange={(e) => setEditing(recalc({ ...editing, taxRate: Number(e.target.value) }))} className="input-field w-16 text-xs" />
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Package className="w-4 h-4" /> Conceptos</h3>
                <button onClick={addItem} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <PlusIcon className="w-3 h-3" /> Agregar
                </button>
              </div>
              <div className="space-y-2">
                {editing.items.map((item, idx) => (
                  <div key={item.id} className="glass-card-light p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {services.length > 0 && (
                        <select onChange={(e) => selectService(idx, e.target.value)} className="input-field text-xs flex-1" defaultValue="">
                          <option value="">Seleccionar servicio...</option>
                          {services.map((s) => <option key={s.id} value={s.id}>{s.name} — {fmt(s.basePrice)}</option>)}
                        </select>
                      )}
                      {editing.items.length > 1 && (
                        <button onClick={() => removeItem(idx)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                    </div>
                    <input value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })} placeholder="Descripción" className="input-field text-xs" />
                    <div className="grid grid-cols-4 gap-2">
                      <input type="number" value={item.quantity || ''} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} className="input-field text-xs" placeholder="Cant." />
                      <input value={item.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} className="input-field text-xs" placeholder="Unidad" />
                      <input type="number" value={item.unitPrice || ''} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })} className="input-field text-xs" placeholder="Precio" />
                      <div className="flex items-center justify-end text-sm font-semibold text-blue-400">
                        {fmt(item.quantity * item.unitPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="glass-card-light p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="text-slate-200">{fmt(editing.subtotal)}</span></div>
              {editing.applyTax && (
                <div className="flex justify-between text-slate-400"><span>IVA ({editing.taxRate}%)</span><span className="text-slate-200">{fmt(editing.taxAmount)}</span></div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700"><span className="text-white">Total</span><span className="text-blue-400">{fmt(editing.total)}</span></div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Notas</label>
              <textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} className="input-field min-h-[60px] resize-none" />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
              {!isNew && (
                <>
                  <button onClick={() => { setPreviewing(editing); }} className="btn-secondary flex items-center gap-1">
                    <Eye className="w-4 h-4" /> Vista previa
                  </button>
                  <button onClick={() => handleDelete(editing.id)} className="btn-danger flex items-center gap-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
