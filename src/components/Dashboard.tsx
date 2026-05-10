import { Users, FileText, ShoppingCart, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Client, Quote, Receipt as ReceiptType } from '../types';

interface Props {
  clients: Client[];
  quotes: Quote[];
  receipts: ReceiptType[];
  currency: string;
}

export default function Dashboard({ clients, quotes, receipts, currency }: Props) {
  const totalSales = receipts
    .filter((r) => r.status === 'pagado')
    .reduce((sum, r) => sum + r.total, 0);

  const pendingAmount = receipts
    .filter((r) => r.status !== 'pagado')
    .reduce((sum, r) => sum + r.balance, 0);

  const recentQuotes = [...quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const recentReceipts = [...receipts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n);

  const statCards = [
    { label: 'Clientes', value: clients.length, icon: Users, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
    { label: 'Cotizaciones', value: quotes.length, icon: FileText, color: 'from-sky-500 to-sky-600', bg: 'bg-sky-50' },
    { label: 'PO / Ventas', value: receipts.length, icon: ShoppingCart, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Ventas', value: fmt(totalSales), icon: DollarSign, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50' },
  ];

  const statusColor: Record<string, string> = {
    borrador: 'bg-slate-500',
    enviada: 'bg-sky-500',
    aceptada: 'bg-emerald-500',
    rechazada: 'bg-red-500',
    pendiente: 'bg-amber-500',
    parcial: 'bg-sky-500',
    pagado: 'bg-emerald-500',
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 shadow-lg`}
          >
            <div className="flex items-center justify-between mb-3">
              <s.icon className="w-6 h-6 text-white/80" />
              <TrendingUp className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-sm text-white/70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending amount banner */}
      {pendingAmount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Pagos pendientes</p>
            <p className="text-lg font-bold text-amber-900">{fmt(pendingAmount)}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent quotes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg text-slate-800">Últimas cotizaciones</h3>
          </div>
          {recentQuotes.length === 0 ? (
            <p className="text-slate-400 text-sm">Sin cotizaciones aún</p>
          ) : (
            <div className="space-y-3">
              {recentQuotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="font-medium truncate text-slate-800">{q.title}</p>
                    <p className="text-xs text-slate-500">{q.clientName || 'Sin cliente'} · {q.quoteNumber}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-slate-700">{fmt(q.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[q.status]} text-white`}>
                      {q.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent receipts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-lg text-slate-800">Últimas PO / Ventas</h3>
          </div>
          {recentReceipts.length === 0 ? (
            <p className="text-slate-400 text-sm">Sin ventas aún</p>
          ) : (
            <div className="space-y-3">
              {recentReceipts.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="font-medium truncate text-slate-800">{r.receiptNumber}</p>
                    <p className="text-xs text-slate-500">{r.clientName || 'Sin cliente'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-slate-700">{fmt(r.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[r.status]} text-white`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
