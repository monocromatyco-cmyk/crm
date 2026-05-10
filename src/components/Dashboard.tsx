import {
  Users, FileText, ShoppingCart, DollarSign,
  TrendingUp, Clock, AlertCircle,
  Activity, Target, BarChart3,
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
              <FileText className="w-3.5 h-3.5" />
              Cotizado
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{fmt(totalQuoted)}</p>
          <p className="text-sm text-slate-500 mt-1">Total cotizado</p>
        </div>
      </div>

      {/* Revenue chart & Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Ingresos últimos 6 meses
          </h3>
          <div className="flex items-end gap-2 h-40">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400 font-medium">
                  {fmtCompact(m.amount)}
                </span>
                <div
                  className="w-full bg-blue-500 rounded-t-md transition-all min-h-[4px]"
                  style={{ height: `${(m.amount / maxMonthly) * 100}%` }}
                />
                <span className="text-[10px] text-slate-500 font-medium uppercase">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Estado de documentos</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">Cotizaciones</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(quotesByStatus).map(([status, count]) => (
                  <span key={status} className={`${statusColor[status]} px-3 py-1 rounded-full text-xs font-medium`}>
                    {status}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500 mb-2 font-medium">PO / Ventas</p>
              <div className="flex gap-2 flex-wrap">
                <span className={`${statusColor.pagado} px-3 py-1 rounded-full text-xs font-medium`}>
                  pagado: {paidReceipts}
                </span>
                <span className={`${statusColor.parcial} px-3 py-1 rounded-full text-xs font-medium`}>
                  parcial: {partialReceipts}
                </span>
                <span className={`${statusColor.pendiente} px-3 py-1 rounded-full text-xs font-medium`}>
                  pendiente: {pendingReceipts}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Cotizaciones recientes
          </h3>
          {recentQuotes.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Sin cotizaciones</p>
          ) : (
            <div className="space-y-2">
              {recentQuotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{q.title || q.quoteNumber}</p>
                    <p className="text-xs text-slate-400">{q.clientName || 'Sin cliente'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">{fmt(q.total)}</p>
                    <span className={`${statusColor[q.status]} px-2 py-0.5 rounded-full text-[10px] font-medium`}>
                      {q.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
            PO / Ventas recientes
          </h3>
          {recentReceipts.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Sin ventas</p>
          ) : (
            <div className="space-y-2">
              {recentReceipts.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{r.receiptNumber}</p>
                    <p className="text-xs text-slate-400">{r.clientName || 'Sin cliente'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">{fmt(r.total)}</p>
                    <span className={`${statusColor[r.status]} px-2 py-0.5 rounded-full text-[10px] font-medium`}>
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
