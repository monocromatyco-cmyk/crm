import {
  Users, FileText, ShoppingCart, DollarSign,
  TrendingUp, Clock, CheckCircle, AlertCircle,
  ArrowUpRight, Activity, Target, Zap, BarChart3,
} from 'lucide-react';
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

  const totalQuoted = quotes.reduce((sum, q) => sum + q.total, 0);

  const acceptedQuotes = quotes.filter((q) => q.status === 'aceptada').length;
  const conversionRate = quotes.length > 0 ? Math.round((acceptedQuotes / quotes.length) * 100) : 0;

  const paidReceipts = receipts.filter((r) => r.status === 'pagado').length;
  const pendingReceipts = receipts.filter((r) => r.status === 'pendiente').length;
  const partialReceipts = receipts.filter((r) => r.status === 'parcial').length;

  const recentQuotes = [...quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const recentReceipts = [...receipts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  // Monthly revenue data (last 6 months)
  const now = new Date();
  const monthlyData: { label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleDateString('es-MX', { month: 'short' });
    const monthReceipts = receipts.filter((r) => {
      const rd = new Date(r.createdAt);
      return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear() && r.status === 'pagado';
    });
    monthlyData.push({ label: monthLabel, amount: monthReceipts.reduce((s, r) => s + r.total, 0) });
  }
  const maxMonthly = Math.max(...monthlyData.map((m) => m.amount), 1);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n);

  const fmtCompact = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return fmt(n);
  };

  const statusColor: Record<string, string> = {
    borrador: 'bg-slate-100 text-slate-600',
    enviada: 'bg-sky-100 text-sky-700',
    aceptada: 'bg-emerald-100 text-emerald-700',
    rechazada: 'bg-red-100 text-red-700',
    pendiente: 'bg-amber-100 text-amber-700',
    parcial: 'bg-sky-100 text-sky-700',
    pagado: 'bg-emerald-100 text-emerald-700',
  };

  const quotesByStatus = {
    borrador: quotes.filter((q) => q.status === 'borrador').length,
    enviada: quotes.filter((q) => q.status === 'enviada').length,
    aceptada: acceptedQuotes,
    rechazada: quotes.filter((q) => q.status === 'rechazada').length,
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-blue-200" />
            <span className="text-sm text-blue-200 font-medium">Resumen general</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold mb-1">¡Bienvenido de vuelta!</h2>
          <p className="text-blue-100 text-sm">Aquí tienes un vistazo rápido a tu negocio hoy.</p>
        </div>
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-200" />
              <span className="text-xs text-blue-200 bg-white/10 rounded-full px-2 py-0.5">Total</span>
            </div>
            <p className="text-2xl font-bold">{clients.length}</p>
            <p className="text-xs text-blue-200 mt-0.5">Clientes</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-blue-200" />
              <span className="text-xs text-blue-200 bg-white/10 rounded-full px-2 py-0.5">Total</span>
            </div>
            <p className="text-2xl font-bold">{quotes.length}</p>
            <p className="text-xs text-blue-200 mt-0.5">Cotizaciones</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-5 h-5 text-blue-200" />
              <span className="text-xs text-blue-200 bg-white/10 rounded-full px-2 py-0.5">Total</span>
            </div>
            <p className="text-2xl font-bold">{receipts.length}</p>
            <p className="text-xs text-blue-200 mt-0.5">PO / Ventas</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-blue-200" />
              <span className="text-xs text-blue-200 bg-white/10 rounded-full px-2 py-0.5">Tasa</span>
            </div>
            <p className="text-2xl font-bold">{conversionRate}%</p>
            <p className="text-xs text-blue-200 mt-0.5">Conversión</p>
          </div>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-1 text-xs font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              Cobrado
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{fmt(totalSales)}</p>
          <p className="text-sm text-slate-500 mt-1">Ventas cobradas</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 rounded-full px-2.5 py-1 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              Pendiente
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{fmt(pendingAmount)}</p>
          <p className="text-sm text-slate-500 mt-1">Por cobrar</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 text-blue-600 bg-blue-50 rounded-full px-2.5 py-1 text-xs font-medium">
              <Zap className="w-3.5 h-3.5" />
              Cotizado
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{fmt(totalQuoted)}</p>
          <p className="text-sm text-slate-500 mt-1">Total cotizado</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Bar chart - Revenue last 6 months */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg text-slate-800">Ingresos</h3>
              <p className="text-sm text-slate-400">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              {fmtCompact(totalSales)}
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {monthlyData.map((m, i) => {
              const height = m.amount > 0 ? Math.max((m.amount / maxMonthly) * 100, 8) : 4;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-medium">
                    {m.amount > 0 ? fmtCompact(m.amount) : '—'}
                  </span>
                  <div className="w-full flex justify-center">
                    <div
                      className={`w-full max-w-10 rounded-t-lg transition-all duration-500 ${
                        m.amount > 0
                          ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                          : 'bg-slate-100'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 capitalize">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quotes breakdown */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-lg text-slate-800 mb-1">Estado de cotizaciones</h3>
          <p className="text-sm text-slate-400 mb-5">Distribución actual</p>
          
          <div className="space-y-4">
            {Object.entries(quotesByStatus).map(([status, count]) => {
              const pct = quotes.length > 0 ? (count / quotes.length) * 100 : 0;
              const colors: Record<string, { bar: string; text: string }> = {
                borrador: { bar: 'bg-slate-400', text: 'text-slate-600' },
                enviada: { bar: 'bg-sky-400', text: 'text-sky-600' },
                aceptada: { bar: 'bg-emerald-400', text: 'text-emerald-600' },
                rechazada: { bar: 'bg-red-400', text: 'text-red-600' },
              };
              const c = colors[status] || colors.borrador;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-medium capitalize ${c.text}`}>{status}</span>
                    <span className="text-sm text-slate-500">{count} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${c.bar} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* PO status pills */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Estado de PO</p>
            <div className="flex gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" /> {paidReceipts} pagadas
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full">
                <Clock className="w-3.5 h-3.5" /> {pendingReceipts} pendientes
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-sky-50 text-sky-700 rounded-full">
                <ArrowUpRight className="w-3.5 h-3.5" /> {partialReceipts} parciales
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent quotes */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-sky-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Últimas cotizaciones</h3>
            </div>
            <span className="text-xs text-slate-400 bg-slate-50 rounded-full px-2.5 py-1">{quotes.length} total</span>
          </div>
          {recentQuotes.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-10 h-10 mx-auto mb-2 text-slate-200" />
              <p className="text-slate-400 text-sm">Sin cotizaciones aún</p>
            </div>
          ) : (
            <div className="p-3 pt-4">
              {recentQuotes.map((q, idx) => (
                <div
                  key={q.id}
                  className={`flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition ${
                    idx !== recentQuotes.length - 1 ? 'mb-1' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center shrink-0 text-sm font-bold text-sky-600">
                    {q.clientName?.charAt(0) || '#'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-slate-800 text-sm">{q.title}</p>
                    <p className="text-xs text-slate-400">{q.clientName || 'Sin cliente'} · {q.quoteNumber}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-slate-700">{fmt(q.total)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[q.status]}`}>
                      {q.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent receipts */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Últimas PO / Ventas</h3>
            </div>
            <span className="text-xs text-slate-400 bg-slate-50 rounded-full px-2.5 py-1">{receipts.length} total</span>
          </div>
          {recentReceipts.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-200" />
              <p className="text-slate-400 text-sm">Sin ventas aún</p>
            </div>
          ) : (
            <div className="p-3 pt-4">
              {recentReceipts.map((r, idx) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition ${
                    idx !== recentReceipts.length - 1 ? 'mb-1' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center shrink-0 text-sm font-bold text-emerald-600">
                    {r.clientName?.charAt(0) || '#'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-slate-800 text-sm">{r.receiptNumber}</p>
                    <p className="text-xs text-slate-400">{r.clientName || 'Sin cliente'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-slate-700">{fmt(r.total)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[r.status]}`}>
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
