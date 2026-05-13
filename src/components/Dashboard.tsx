import { Client, Quote, Receipt, Settings } from '../types';
import {
  Users, FileText, ShoppingCart, TrendingUp,
  DollarSign, Clock, BarChart3, ArrowUpRight, ArrowDownRight,
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
  const pendingAmount = receipts.filter((r) => r.status !== 'pagado').reduce((s, r) => s + r.balance, 0);
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
    borrador: 'bg-slate-500/20 text-slate-400',
    enviada: 'bg-sky-500/20 text-sky-400',
    aceptada: 'bg-emerald-500/20 text-emerald-400',
    rechazada: 'bg-red-500/20 text-red-400',
  };

  const statusColorReceipt: Record<string, string> = {
    pendiente: 'bg-amber-500/20 text-amber-400',
    parcial: 'bg-sky-500/20 text-sky-400',
    pagado: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <div className="space-y-6 view-enter">
      {/* Welcome */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-violet-600/5 to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Resumen general</h2>
          </div>
          <p className="text-slate-400 text-sm">¡Bienvenido de vuelta! Aquí tienes un vistazo rápido a tu negocio.</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 glow-blue group hover:border-blue-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-2xl font-bold text-white">{clients.length}</p>
          <p className="text-xs text-slate-500 mt-1">Clientes</p>
        </div>

        <div className="glass-card p-5 glow-violet group hover:border-violet-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-400" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-2xl font-bold text-white">{quotes.length}</p>
          <p className="text-xs text-slate-500 mt-1">Cotizaciones</p>
        </div>

        <div className="glass-card p-5 glow-emerald group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-2xl font-bold text-white">{receipts.length}</p>
          <p className="text-xs text-slate-500 mt-1">PO / Ventas</p>
        </div>

        <div className="glass-card p-5 glow-amber group hover:border-amber-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <ArrowDownRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-2xl font-bold text-white">{conversionRate}%</p>
          <p className="text-xs text-slate-500 mt-1">Conversión</p>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Cobrado</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">{fmt(totalSales)}</p>
          <p className="text-xs text-slate-500 mt-1">Ventas cobradas</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Pendiente</span>
          </div>
          <p className="text-xl font-bold text-amber-400">{fmt(pendingAmount)}</p>
          <p className="text-xs text-slate-500 mt-1">Por cobrar</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Cotizado</span>
          </div>
          <p className="text-xl font-bold text-blue-400">{fmt(totalQuoted)}</p>
          <p className="text-xs text-slate-500 mt-1">Total cotizado</p>
        </div>
      </div>

      {/* Revenue chart & Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly chart */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-300">Ingresos últimos 6 meses</h3>
          </div>
          <div className="flex items-end gap-2 h-40">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500">{fmtCompact(m.amount)}</span>
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 min-h-[4px]"
                  style={{ height: `${(m.amount / maxMonthly) * 100}%` }}
                />
                <span className="text-[10px] text-slate-500 uppercase">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Estado de documentos</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-semibold">Cotizaciones</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(quotesByStatus).map(([status, count]) => (
                  <span key={status} className={`status-badge ${statusColorQuote[status] || 'bg-slate-700 text-slate-400'}`}>
                    {status}: {count}
                  </span>
                ))}
                {Object.keys(quotesByStatus).length === 0 && <span className="text-xs text-slate-600">Sin datos</span>}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-semibold">PO / Ventas</p>
              <div className="flex flex-wrap gap-2">
                <span className="status-badge bg-emerald-500/20 text-emerald-400">pagado: {paidReceipts}</span>
                <span className="status-badge bg-sky-500/20 text-sky-400">parcial: {partialReceipts}</span>
                <span className="status-badge bg-amber-500/20 text-amber-400">pendiente: {pendingReceipts}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-slate-300">Cotizaciones recientes</h3>
          </div>
          {recentQuotes.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-4">Sin cotizaciones</p>
          ) : (
            <div className="space-y-2">
              {recentQuotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{q.title || q.quoteNumber}</p>
                    <p className="text-xs text-slate-500">{q.clientName || 'Sin cliente'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-200">{fmt(q.total)}</p>
                    <span className={`status-badge text-[10px] ${statusColorQuote[q.status] || ''}`}>{q.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-300">PO / Ventas recientes</h3>
          </div>
          {recentReceipts.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-4">Sin ventas</p>
          ) : (
            <div className="space-y-2">
              {recentReceipts.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{r.receiptNumber}</p>
                    <p className="text-xs text-slate-500">{r.clientName || 'Sin cliente'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-200">{fmt(r.total)}</p>
                    <span className={`status-badge text-[10px] ${statusColorReceipt[r.status] || ''}`}>{r.status}</span>
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
