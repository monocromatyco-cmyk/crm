import { useState } from 'react';
import { Search, Plus, FileText, Trash2, X, Eye, Mail, Minus } from 'lucide-react';
import { Client, Service, Quote, QuoteItem, Settings } from '../types';
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
  return { id: genId(), description: '', quantity: 1, unit: 'servicio', unitPrice: 0, lineTotal: 0 };
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

Agradecemos sinceramente su solicitud. Es un placer atenderle.

A continuación le compartimos los detalles de su cotización ${q.quoteNumber}:

${q.title ? `Concepto: ${q.title}\n` : ''}Fecha: ${today}
${q.validUntil ? `Válida hasta: ${q.validUntil}\n` : ''}
─────────────────────────────────
DETALLE DE CONCEPTOS:
─────────────────────────────────
${itemsDetail}

─────────────────────────────────
Subtotal: ${fmt(q.subtotal)}${q.applyTax ? `\nIVA (${q.taxRate}%): ${fmt(q.taxAmount)}` : ''}
TOTAL: ${fmt(q.total)}
─────────────────────────────────

${q.notes ? `Notas: ${q.notes}\n` : ''}
Quedamos a sus órdenes para cualquier duda o aclaración.

Saludos cordiales,
${businessName}${settings.phone ? `\nTel: ${settings.phone}` : ''}${settings.email ? `\nEmail: ${settings.email}` : ''}`
    );

    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${subject}&body=${body}`, '_blank');
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
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
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm">
          <Plus className="w-4 h-4" /> Nueva
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          No hay cotizaciones
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(q)}>
                  <p className="font-semibold text-slate-800 truncate">{q.title}</p>
                  <p className="text-sm text-slate-500">{q.clientName || 'Sin cliente'} · {q.quoteNumber}</p>
                </div>
                <div className="text-right mr-3">
                  <p className="font-semibold text-slate-800">{fmt(q.total)}</p>
                  <span className={`${statusColor[q.status]} px-2 py-0.5 rounded-full text-[10px] font-medium text-white`}>
                    {q.status}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setPrinting(q)} className="p-1.5 text-slate-400 hover:text-blue-600 transition" title="Ver / PDF">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEmail(q)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition" title="Email">
                    <Mail className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="font-bold text-lg text-slate-800">{isNew ? 'Nueva cotización' : 'Editar cotización'}</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Título *</label>
                  <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Número</label>
                  <input value={editing.quoteNumber} onChange={(e) => setEditing({ ...editing, quoteNumber: e.target.value })} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Cliente</label>
                  <select
                    value={editing.clientId}
                    onChange={(e) => {
                      const c = clients.find((cl) => cl.id === e.target.value);
                      setEditing({ ...editing, clientId: e.target.value, clientName: c?.fullName || '' });
                    }}
                    className="input-field"
                  >
                    <option value="">Seleccionar...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Estado</label>
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
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Válida hasta</label>
                  <input type="date" value={editing.validUntil} onChange={(e) => setEditing({ ...editing, validUntil: e.target.value })} className="input-field" />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editing.applyTax}
                      onChange={(e) => setEditing(recalc({ ...editing, applyTax: e.target.checked }))}
                      className="accent-blue-500 w-4 h-4"
                    />
                    Aplicar IVA
                  </label>
                  {editing.applyTax && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">%</span>
                      <input
                        type="number"
                        value={editing.taxRate}
                        onChange={(e) => setEditing(recalc({ ...editing, taxRate: Number(e.target.value) }))}
                        className="input-field w-20"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600">Conceptos</label>
                  <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Agregar</button>
                </div>
                <div className="space-y-3">
                  {editing.items.map((item, idx) => (
                    <div key={item.id} className="bg-slate-50 rounded-lg p-3 space-y-2">
                      <div className="flex gap-2 items-center">
                        {services.length > 0 && (
                          <select onChange={(e) => selectService(idx, e.target.value)} className="input-field text-xs flex-1" defaultValue="">
                            <option value="">Desde catálogo...</option>
                            {services.map((sv) => (
                              <option key={sv.id} value={sv.id}>{sv.name}</option>
                            ))}
                          </select>
                        )}
                        {editing.items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600">
                            <Minus className="w-4 h-4" />
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
                        <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} className="input-field text-xs" placeholder="Cant." />
                        <input value={item.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} className="input-field text-xs" placeholder="Unidad" />
                        <input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })} className="input-field text-xs" placeholder="Precio" />
                        <div className="flex items-center justify-end text-xs font-semibold text-slate-700">
                          {fmt(item.quantity * item.unitPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">{fmt(editing.subtotal)}</span></div>
                {editing.applyTax && (
                  <div className="flex justify-between"><span className="text-slate-500">IVA ({editing.taxRate}%)</span><span className="font-medium">{fmt(editing.taxAmount)}</span></div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-1"><span>Total</span><span className="text-blue-600">{fmt(editing.total)}</span></div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Notas</label>
                <textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} className="input-field min-h-[60px]" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-slate-200">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition">
                {isNew ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print preview */}
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
          status={printing.status}
          settings={settings}
          onClose={() => setPrinting(null)}
        />
      )}
    </div>
  );
}
