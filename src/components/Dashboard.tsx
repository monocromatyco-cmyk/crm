import { Client, Quote, Receipt, Settings } from '../types';
import {
  Users, FileText, ShoppingCart, TrendingUp,
  DollarSign, Clock, BarChart3,
  Sparkles,
} from 'lucide-react';

interface Props {
  clients: Client[];
  quotes: Quote[];
  receipts: Receipt[];
  settings: Settings;
}

export default function Dashboard({ clients, quotes, receipts, settings }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: settings.currency }).format(n);

  const fmtCompact = (n: number) =>
    new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1, style: 'currency', currency: settings.currency }).format(n);

  const totalSales = receipts.filter((r) => r.status === 'pagado').reduce((s, r) => s + r.total, 0);
  const pendingAmount = receipts.filter(r => r.status !== 'pagado').reduce((s, r) => s + r.balance, 0);
  const totalQuoted = quotes.reduce((s, q) => s + q.total, 0);
  const conversionRate = quotes.length > 0 ? Math.round((quotes.filter((q) => q.status === 'aceptada').length / quotes.length) * 100) : 0;

  const paidReceipts = receipts.filter((r) => r.status === 'pagado').length;
  const partialReceipts = receipts.filter((r) => r.status === 'parcial').length;
  const pendingReceipts = receipts.filter((r) => r.status === 'pendiente').length;

  const quotesByStatus = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  // Monthly revenue data
  const monthlyData = (() => {
    const months: { label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('es-MX', { month: 'short' });
      const month = d.getMonth();
      const year = d.getFullYear();
      const amount = receipts
        .filter((r) => {
          const rd = new Date(r.createdAt);
          return rd.getMonth() === month && rd.getFullYear() === year && r.status === 'pagado';
        })
        .reduce((s, r) => s + r.total, 0);
      months.push({ label, amount });
    }
    return months;
  })();

  const maxMonthly = Math.max(...monthlyData.map((m) => m.amount), 1);

  const recentQuotes = [...quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const recentReceipts = [...receipts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const statusColorQuote: Record<string, string> = {
    borrador: 'bg-gray-100 text-gray-600',
    enviada: 'bg-sky-50 text-sky-700',
    aceptada: 'bg-emerald-50 text-emerald-700',
    rechazada: 'bg-red-50 text-red-700',
  };

  const statusColorReceipt: Record<string, string> = {
    pendiente: 'bg-amber-50 text-amber-700',
    parcial: 'bg-sky-50 text-sky-700',
    pagado: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className="space-y-6 view-enter">
      {/* Welcome */}
      <div className="card-base p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900">Resumen general</h2>
          </div>
          <p className="text-gray-500 text-sm">¡Bienvenido de vuelta! Aquí tienes un vistazo rápido a tu negocio.</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-base p-5 group hover:border-blue-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
          <p className="text-xs text-gray-500 mt-1">Clientes</p>
        </div>

        <div className="card-base p-5 group hover:border-violet-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
          <p className="text-xs text-gray-500 mt-1">Cotizaciones</p>
        </div>

        <div className="card-base p-5 group hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{receipts.length}</p>
          <p className="text-xs text-gray-500 mt-1">PO / Ventas</p>
        </div>

        <div className="card-base p-5 group hover:border-amber-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{conversionRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Conversión</p>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-2 text-emerald-600">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Cobrado</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{fmt(totalSales)}</p>
          <p className="text-xs text-gray-500 mt-1">Ventas cobradas</p>
        </div>

        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-2 text-amber-600">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Pendiente</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{fmt(pendingAmount)}</p>
          <p className="text-xs text-gray-500 mt-1">Por cobrar</p>
        </div>

        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Cotizado</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{fmt(totalQuoted)}</p>
          <p className="text-xs text-gray-500 mt-1">Total cotizado</p>
        </div>
      </div>

      {/* Revenue chart & Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly chart */}
        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900">Ingresos últimos 6 meses</h3>
          </div>
          <div className="flex items-end gap-2 h-32">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-500">{fmtCompact(m.amount)}</span>
                <div
                  className="w-full bg-blue-100 rounded-t-md transition-all duration-500"
                  style={{ height: `${Math.max((m.amount / maxMonthly) * 100, 4)}%` }}
                >
                  <div
                    className="w-full h-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md"
                    style={{ opacity: m.amount > 0 ? 1 : 0.2 }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 capitalize">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="card-base p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Estado de documentos</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Cotizaciones</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(quotesByStatus).map(([status, count]) => (
                  <span key={status} className={`status-badge ${statusColorQuote[status] || 'bg-gray-100 text-gray-600'}`}>
                    {status}: {count}
                  </span>
                ))}
                {Object.keys(quotesByStatus).length === 0 && <span className="text-xs text-gray-400">Sin datos</span>}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">PO / Ventas</p>
              <div className="flex flex-wrap gap-2">
                <span className={`status-badge ${statusColorReceipt.pagado}`}>pagado: {paidReceipts}</span>
                <span className={`status-badge ${statusColorReceipt.parcial}`}>parcial: {partialReceipts}</span>
                <span className={`status-badge ${statusColorReceipt.pendiente}`}>pendiente: {pendingReceipts}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-gray-900">Cotizaciones recientes</h3>
          </div>
          {recentQuotes.length === 0 ? (
            <p className="text-sm text-gray-400">Sin cotizaciones</p>
          ) : (
            <div className="space-y-2">
              {recentQuotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{q.title || q.quoteNumber}</p>
                    <p className="text-xs text-gray-500">{q.clientName || 'Sin cliente'}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-900">{fmt(q.total)}</p>
                    <span className={`status-badge text-[10px] ${statusColorQuote[q.status] || 'bg-gray-100 text-gray-600'}`}>{q.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-900">PO / Ventas recientes</h3>
          </div>
          {recentReceipts.length === 0 ? (
            <p className="text-sm text-gray-400">Sin ventas</p>
          ) : (
            <div className="space-y-2">
              {recentReceipts.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.receiptNumber}</p>
                    <p className="text-xs text-gray-500">{r.clientName || 'Sin cliente'}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-900">{fmt(r.total)}</p>
                    <span className={`status-badge text-[10px] ${statusColorReceipt[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
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
