import { X, Printer, Mail } from 'lucide-react';
import { Settings, Client } from '../types';

interface PrintItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

interface Props {
  type: 'cotizacion' | 'venta';
  docNumber: string;
  title?: string;
  client: Client | null;
  items: PrintItem[];
  subtotal: number;
  applyTax: boolean;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
  validUntil?: string;
  status?: string;
  settings: Settings;
  onClose: () => void;
}

export default function PrintDocument({
  type,
  docNumber,
  title,
  client,
  items,
  subtotal,
  applyTax,
  taxRate,
  taxAmount,
  total,
  notes,
  validUntil,
  settings,
  onClose,
}: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: settings.currency }).format(n);

  const today = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  function handlePrint() {
    window.print();
  }

  function handleEmail() {
    const clientEmail = client?.email || '';
    const docTypeLabel = type === 'cotizacion' ? 'Cotización' : 'Orden de Compra';
    const businessName = settings.businessName || 'Órbita CRM';
    
    const itemsDetail = items
      .map((item, idx) => `  ${idx + 1}. ${item.description} — Cant: ${item.quantity} ${item.unit} — P.U.: ${fmt(item.unitPrice)} — Total: ${fmt(item.lineTotal)}`)
      .join('\n');

    const subject = encodeURIComponent(`${docTypeLabel} ${docNumber} — ${businessName}`);
    const body = encodeURIComponent(
`Estimado/a ${client?.fullName || 'cliente'},

Agradecemos sinceramente su solicitud. Es un placer atenderle.

A continuación le compartimos los detalles de su ${docTypeLabel.toLowerCase()} ${docNumber}:

${title ? `Concepto: ${title}\n` : ''}Fecha: ${today}
${validUntil ? `Válida hasta: ${validUntil}\n` : ''}
─────────────────────────────────
DETALLE DE CONCEPTOS:
─────────────────────────────────
${itemsDetail}

─────────────────────────────────
Subtotal: ${fmt(subtotal)}${applyTax ? `\nIVA (${taxRate}%): ${fmt(taxAmount)}` : ''}
TOTAL: ${fmt(total)}
─────────────────────────────────

${notes ? `Notas: ${notes}\n` : ''}${settings.bankName ? `\nDatos bancarios:\nBanco: ${settings.bankName}${settings.bankAccount ? `\nCuenta: ${settings.bankAccount}` : ''}${settings.bankClabe ? `\nCLABE: ${settings.bankClabe}` : ''}${settings.bankBeneficiary ? `\nBeneficiario: ${settings.bankBeneficiary}` : ''}` : ''}

Quedamos a sus órdenes para cualquier duda o aclaración.

Saludos cordiales,
${businessName}${settings.phone ? `\nTel: ${settings.phone}` : ''}${settings.email ? `\nEmail: ${settings.email}` : ''}`
    );

    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${subject}&body=${body}`, '_blank');
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center overflow-y-auto p-4 print:p-0 print:bg-white">
      {/* Control buttons - hidden on print */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-[101]">
        <button
          onClick={handleEmail}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg transition"
          title="Enviar por email"
        >
          <Mail className="w-4 h-4" /> Enviar Email
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg transition"
        >
          <Printer className="w-4 h-4" /> Imprimir / PDF
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white hover:bg-slate-100 rounded-lg shadow-lg transition"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Document - SINGLE page */}
      <div className="print-container bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 p-8 print:my-0 print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
          <div className="flex items-start gap-4">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-20 h-20 object-contain" />
            ) : (
              <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {settings.businessName?.charAt(0) || 'O'}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-800">{settings.businessName}</h1>
              {settings.phone && <p className="text-sm text-slate-500">{settings.phone}</p>}
              {settings.email && <p className="text-sm text-slate-500">{settings.email}</p>}
              {settings.address && <p className="text-sm text-slate-500">{settings.address}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-blue-600 uppercase">
              {type === 'cotizacion' ? 'Cotización' : 'Orden de Compra'}
            </h2>
            <p className="text-lg font-semibold text-slate-700">{docNumber}</p>
            <p className="text-sm text-slate-500 mt-1">{today}</p>
            {validUntil && (
              <p className="text-xs text-slate-400 mt-1">Válido hasta: {validUntil}</p>
            )}
          </div>
        </div>

        {/* Client info */}
        {client && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">CLIENTE</h3>
            <p className="font-semibold text-slate-800">{client.fullName}</p>
            {client.companyName && <p className="text-sm text-slate-600">{client.companyName}</p>}
            {client.email && <p className="text-sm text-slate-500">{client.email}</p>}
            {client.phone && <p className="text-sm text-slate-500">{client.phone}</p>}
            {client.address && <p className="text-sm text-slate-500">{client.address}</p>}
          </div>
        )}

        {/* Title */}
        {title && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          </div>
        )}

        {/* Items table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="bg-blue-50 text-left">
              <th className="py-3 px-4 text-sm font-semibold text-slate-700 rounded-l-lg">Descripción</th>
              <th className="py-3 px-2 text-sm font-semibold text-slate-700 text-center w-20">Cant.</th>
              <th className="py-3 px-2 text-sm font-semibold text-slate-700 text-center w-20">Unidad</th>
              <th className="py-3 px-2 text-sm font-semibold text-slate-700 text-right w-28">P. Unit.</th>
              <th className="py-3 px-4 text-sm font-semibold text-slate-700 text-right rounded-r-lg w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-3 px-4 text-sm text-slate-700">{item.description}</td>
                <td className="py-3 px-2 text-sm text-slate-600 text-center">{item.quantity}</td>
                <td className="py-3 px-2 text-sm text-slate-600 text-center">{item.unit}</td>
                <td className="py-3 px-2 text-sm text-slate-600 text-right">{fmt(item.unitPrice)}</td>
                <td className="py-3 px-4 text-sm font-semibold text-slate-700 text-right">{fmt(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals and QR */}
        <div className="flex justify-between gap-8">
          {/* QR Code */}
          {settings.qrUrl && (
            <div className="flex flex-col items-center">
              <img src={settings.qrUrl} alt="QR Pago" className="w-32 h-32 object-contain border border-slate-200 rounded-lg p-2" />
              <p className="text-xs text-slate-500 mt-2 text-center">Escanea para pagar</p>
            </div>
          )}

          {/* Totals */}
          <div className="flex-1 max-w-xs ml-auto">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium text-slate-700">{fmt(subtotal)}</span>
              </div>
              {applyTax && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">IVA ({taxRate}%)</span>
                  <span className="font-medium text-slate-700">{fmt(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2 mt-2">
                <span className="text-slate-800">Total</span>
                <span className="text-blue-600">{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-600 mb-1">Notas</h4>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{notes}</p>
          </div>
        )}

        {/* Bank info */}
        {(settings.bankName || settings.bankAccount || settings.bankClabe) && (
          <div className="mt-6 p-4 border border-slate-200 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-600 mb-2">Datos bancarios</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {settings.bankName && (
                <>
                  <span className="text-slate-500">Banco:</span>
                  <span className="text-slate-700">{settings.bankName}</span>
                </>
              )}
              {settings.bankAccount && (
                <>
                  <span className="text-slate-500">Cuenta:</span>
                  <span className="text-slate-700">{settings.bankAccount}</span>
                </>
              )}
              {settings.bankClabe && (
                <>
                  <span className="text-slate-500">CLABE:</span>
                  <span className="text-slate-700">{settings.bankClabe}</span>
                </>
              )}
              {settings.bankBeneficiary && (
                <>
                  <span className="text-slate-500">Beneficiario:</span>
                  <span className="text-slate-700">{settings.bankBeneficiary}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Documento generado por {settings.businessName || 'Órbita CRM'}
          </p>
        </div>
      </div>
    </div>
  );
}
