import { useRef, useState } from 'react';
import { X, Download, Mail, Loader2 } from 'lucide-react';
import { Settings, Client } from '../types';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

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
  const printRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: settings.currency }).format(n);

  const today = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  async function handleDownloadPDF() {
    if (!printRef.current || generating) return;
    setGenerating(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      const docTypeLabel = type === 'cotizacion' ? 'Cotizacion' : 'PO';
      pdf.save(`${docTypeLabel}_${docNumber}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
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
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center overflow-y-auto p-4">
      {/* Control buttons */}
      <div className="fixed top-4 right-4 flex gap-2 z-[101]">
        <button
          onClick={handleEmail}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg transition"
          title="Enviar por email"
        >
          <Mail className="w-4 h-4" /> <span className="hidden sm:inline">Email</span>
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg transition disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{generating ? 'Generando...' : 'Descargar PDF'}</span>
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white hover:bg-slate-100 rounded-lg shadow-lg transition"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Document */}
      <div
        ref={printRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 p-8"
        style={{ minHeight: '297mm' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
          <div className="flex items-start gap-4">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-20 h-20 object-contain" crossOrigin="anonymous" />
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
        <div className="flex justify-between items-end mb-6">
          <div className="flex-1">
            {settings.qrUrl && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Escanea para pagar</p>
                <img src={settings.qrUrl} alt="QR" className="w-28 h-28 object-contain" crossOrigin="anonymous" />
              </div>
            )}
          </div>
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-700 font-medium">{fmt(subtotal)}</span>
            </div>
            {applyTax && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">IVA ({taxRate}%)</span>
                <span className="text-slate-700 font-medium">{fmt(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
              <span className="text-slate-700">Total</span>
              <span className="text-blue-600">{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-1">Notas</h3>
            <p className="text-sm text-slate-500 whitespace-pre-wrap">{notes}</p>
          </div>
        )}

        {/* Bank details */}
        {settings.bankName && (
          <div className="border border-slate-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Datos bancarios</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-slate-500">Banco:</span>
              <span className="text-slate-700">{settings.bankName}</span>
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
        <div className="text-center border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-400">
            Documento generado por {settings.businessName || 'Órbita CRM'}
          </p>
          {settings.phone && <p className="text-xs text-slate-400">{settings.phone}</p>}
          {settings.email && <p className="text-xs text-slate-400">{settings.email}</p>}
        </div>
      </div>
    </div>
  );
}
