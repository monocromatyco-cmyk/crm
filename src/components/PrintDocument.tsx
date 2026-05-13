import { useRef, useState } from 'react';
import { X, Download, Printer, Mail, Loader2 } from 'lucide-react';
import { Settings, Client } from '../types';
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

  // Generate PDF using jsPDF directly (no html2canvas dependency issues)
  async function handleDownloadPDF() {
    if (generating) return;
    setGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pageW = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = margin;

      // Helper functions
      const addText = (text: string, x: number, _y: number, opts?: { fontSize?: number; fontStyle?: string; color?: [number, number, number]; align?: 'left' | 'center' | 'right'; maxWidth?: number }) => {
        pdf.setFontSize(opts?.fontSize || 10);
        pdf.setFont('helvetica', opts?.fontStyle || 'normal');
        pdf.setTextColor(...(opts?.color || [51, 51, 51]));
        const align = opts?.align || 'left';
        const maxW = opts?.maxWidth || contentW;
        if (align === 'right') {
          pdf.text(text, x, _y, { align: 'right', maxWidth: maxW });
        } else if (align === 'center') {
          pdf.text(text, x, _y, { align: 'center', maxWidth: maxW });
        } else {
          pdf.text(text, x, _y, { maxWidth: maxW });
        }
      };

      const drawLine = (_y: number) => {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(margin, _y, pageW - margin, _y);
      };

      // === HEADER ===
      addText(settings.businessName || 'Órbita CRM', margin, y, { fontSize: 16, fontStyle: 'bold', color: [30, 30, 30] });
      y += 5;
      if (settings.phone) { addText(settings.phone, margin, y, { fontSize: 8, color: [120, 120, 120] }); y += 3.5; }
      if (settings.email) { addText(settings.email, margin, y, { fontSize: 8, color: [120, 120, 120] }); y += 3.5; }
      if (settings.address) { addText(settings.address, margin, y, { fontSize: 8, color: [120, 120, 120] }); y += 3.5; }

      // Document type and number on the right
      const docLabel = type === 'cotizacion' ? 'COTIZACIÓN' : 'ORDEN DE COMPRA';
      addText(docLabel, pageW - margin, margin, { fontSize: 14, fontStyle: 'bold', color: [59, 130, 246], align: 'right' });
      addText(docNumber, pageW - margin, margin + 6, { fontSize: 11, fontStyle: 'bold', color: [60, 60, 60], align: 'right' });
      addText(today, pageW - margin, margin + 11, { fontSize: 8, color: [120, 120, 120], align: 'right' });
      if (validUntil) {
        addText(`Válido hasta: ${validUntil}`, pageW - margin, margin + 15, { fontSize: 7, color: [150, 150, 150], align: 'right' });
      }

      y = Math.max(y, margin + 20) + 5;
      drawLine(y);
      y += 8;

      // === CLIENT INFO ===
      if (client) {
        addText('CLIENTE', margin, y, { fontSize: 8, fontStyle: 'bold', color: [120, 120, 120] });
        y += 5;
        addText(client.fullName, margin, y, { fontSize: 10, fontStyle: 'bold' });
        y += 4;
        if (client.companyName) { addText(client.companyName, margin, y, { fontSize: 9, color: [80, 80, 80] }); y += 4; }
        if (client.email) { addText(client.email, margin, y, { fontSize: 8, color: [120, 120, 120] }); y += 3.5; }
        if (client.phone) { addText(client.phone, margin, y, { fontSize: 8, color: [120, 120, 120] }); y += 3.5; }
        if (client.address) { addText(client.address, margin, y, { fontSize: 8, color: [120, 120, 120] }); y += 3.5; }
        y += 5;
      }

      // === TITLE ===
      if (title) {
        addText(`Concepto: ${title}`, margin, y, { fontSize: 10, fontStyle: 'bold' });
        y += 8;
      }

      // === TABLE HEADER ===
      const colX = {
        num: margin,
        desc: margin + 8,
        qty: margin + contentW * 0.50,
        unit: margin + contentW * 0.58,
        price: margin + contentW * 0.72,
        total: pageW - margin,
      };

      // Table header background
      pdf.setFillColor(245, 247, 250);
      pdf.rect(margin, y - 3, contentW, 7, 'F');

      addText('#', colX.num, y, { fontSize: 8, fontStyle: 'bold', color: [100, 100, 100] });
      addText('Descripción', colX.desc, y, { fontSize: 8, fontStyle: 'bold', color: [100, 100, 100] });
      addText('Cant.', colX.qty, y, { fontSize: 8, fontStyle: 'bold', color: [100, 100, 100] });
      addText('Unidad', colX.unit, y, { fontSize: 8, fontStyle: 'bold', color: [100, 100, 100] });
      addText('P.U.', colX.price, y, { fontSize: 8, fontStyle: 'bold', color: [100, 100, 100] });
      addText('Total', colX.total, y, { fontSize: 8, fontStyle: 'bold', color: [100, 100, 100], align: 'right' });
      y += 6;
      drawLine(y);
      y += 4;

      // === TABLE ROWS ===
      items.forEach((item, idx) => {
        if (y > 240) {
          pdf.addPage();
          y = margin;
        }
        addText(`${idx + 1}`, colX.num, y, { fontSize: 9, color: [150, 150, 150] });
        
        // Handle long descriptions
        const maxDescW = contentW * 0.40;
        const lines = pdf.splitTextToSize(item.description || '', maxDescW);
        lines.forEach((line: string, li: number) => {
          addText(line, colX.desc, y + (li * 4), { fontSize: 9 });
        });
        
        addText(`${item.quantity}`, colX.qty, y, { fontSize: 9 });
        addText(item.unit, colX.unit, y, { fontSize: 9 });
        addText(fmt(item.unitPrice), colX.price, y, { fontSize: 9 });
        addText(fmt(item.lineTotal), colX.total, y, { fontSize: 9, fontStyle: 'bold', align: 'right' });
        
        y += Math.max(lines.length * 4, 5) + 2;
        
        // Light separator
        pdf.setDrawColor(235, 235, 235);
        pdf.setLineWidth(0.2);
        pdf.line(margin, y, pageW - margin, y);
        y += 3;
      });

      y += 3;

      // === TOTALS ===
      const totalsX = pageW - margin - 60;
      
      addText('Subtotal:', totalsX, y, { fontSize: 9, color: [100, 100, 100] });
      addText(fmt(subtotal), pageW - margin, y, { fontSize: 9, align: 'right' });
      y += 5;

      if (applyTax) {
        addText(`IVA (${taxRate}%):`, totalsX, y, { fontSize: 9, color: [100, 100, 100] });
        addText(fmt(taxAmount), pageW - margin, y, { fontSize: 9, align: 'right' });
        y += 5;
      }

      drawLine(y);
      y += 5;

      pdf.setFillColor(59, 130, 246);
      pdf.rect(totalsX - 5, y - 4, pageW - margin - totalsX + 5, 8, 'F');
      addText('TOTAL:', totalsX, y, { fontSize: 10, fontStyle: 'bold', color: [255, 255, 255] });
      addText(fmt(total), pageW - margin, y, { fontSize: 10, fontStyle: 'bold', color: [255, 255, 255], align: 'right' });
      y += 12;

      // === NOTES ===
      if (notes) {
        if (y > 230) { pdf.addPage(); y = margin; }
        addText('NOTAS', margin, y, { fontSize: 8, fontStyle: 'bold', color: [120, 120, 120] });
        y += 4;
        const noteLines = pdf.splitTextToSize(notes, contentW);
        noteLines.forEach((line: string) => {
          addText(line, margin, y, { fontSize: 8, color: [100, 100, 100] });
          y += 3.5;
        });
        y += 5;
      }

      // === BANK DATA ===
      if (settings.bankName) {
        if (y > 230) { pdf.addPage(); y = margin; }
        addText('DATOS BANCARIOS', margin, y, { fontSize: 8, fontStyle: 'bold', color: [120, 120, 120] });
        y += 4;
        addText(`Banco: ${settings.bankName}`, margin, y, { fontSize: 8, color: [80, 80, 80] }); y += 3.5;
        if (settings.bankAccount) { addText(`Cuenta: ${settings.bankAccount}`, margin, y, { fontSize: 8, color: [80, 80, 80] }); y += 3.5; }
        if (settings.bankClabe) { addText(`CLABE: ${settings.bankClabe}`, margin, y, { fontSize: 8, color: [80, 80, 80] }); y += 3.5; }
        if (settings.bankBeneficiary) { addText(`Beneficiario: ${settings.bankBeneficiary}`, margin, y, { fontSize: 8, color: [80, 80, 80] }); y += 3.5; }
      }

      // === QR CODE ===
      if (settings.qrUrl) {
        try {
          if (y > 220) { pdf.addPage(); y = margin; }
          y += 5;
          addText('Escanea para pagar', margin, y, { fontSize: 8, color: [120, 120, 120] });
          y += 3;
          pdf.addImage(settings.qrUrl, 'PNG', margin, y, 30, 30);
        } catch {
          // QR image failed, skip
        }
      }

      const docTypeLabel = type === 'cotizacion' ? 'Cotizacion' : 'PO';
      pdf.save(`${docTypeLabel}_${docNumber}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  }

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
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
      {/* Control buttons - FIXED AT TOP */}
      <div className="fixed top-4 right-4 flex gap-2 z-[101] no-print">
        <button
          onClick={handleEmail}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-all text-sm font-medium"
          title="Enviar por email"
        >
          <Mail className="w-4 h-4" /> <span className="hidden sm:inline">Email</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-lg transition-all text-sm font-medium"
          title="Imprimir"
        >
          <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Imprimir</span>
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 text-sm font-medium"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{generating ? 'Generando...' : 'Guardar PDF'}</span>
        </button>
        <button
          onClick={onClose}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl shadow-lg transition-all"
        >
          <X className="w-5 h-5 text-slate-300" />
        </button>
      </div>

      {/* Document Preview */}
      <div
        ref={printRef}
        className="print-document bg-white rounded-2xl shadow-2xl w-full max-w-[210mm] my-12 mx-auto"
        style={{ minHeight: '297mm', padding: '20mm', color: '#1a1a1a' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', borderRadius: '12px' }} crossOrigin="anonymous" />
            ) : (
              <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
                  {(settings.businessName || 'O').charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>{settings.businessName}</h1>
              {settings.phone && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{settings.phone}</p>}
              {settings.email && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{settings.email}</p>}
              {settings.address && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{settings.address}</p>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', margin: 0 }}>
              {type === 'cotizacion' ? 'Cotización' : 'Orden de Compra'}
            </h2>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '4px 0' }}>{docNumber}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0' }}>{today}</p>
            {validUntil && <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0' }}>Válido hasta: {validUntil}</p>}
          </div>
        </div>

        {/* Client info */}
        {client && (
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Cliente</h3>
            <p style={{ fontWeight: '600', color: '#1a1a1a', margin: '2px 0', fontSize: '14px' }}>{client.fullName}</p>
            {client.companyName && <p style={{ fontSize: '12px', color: '#4b5563', margin: '2px 0' }}>{client.companyName}</p>}
            {client.email && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{client.email}</p>}
            {client.phone && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{client.phone}</p>}
            {client.address && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{client.address}</p>}
          </div>
        )}

        {/* Title */}
        {title && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Concepto: {title}</p>
          </div>
        )}

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '11px', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>#</th>
              <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '11px', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Descripción</th>
              <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: '11px', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Cant.</th>
              <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: '11px', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Unidad</th>
              <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '11px', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>P.U.</th>
              <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '11px', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{idx + 1}</td>
                <td style={{ padding: '10px 8px', color: '#1a1a1a', fontWeight: '500' }}>{item.description}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center', color: '#374151' }}>{item.quantity}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center', color: '#6b7280' }}>{item.unit}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', color: '#374151' }}>{fmt(item.unitPrice)}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '600', color: '#1a1a1a' }}>{fmt(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div style={{ minWidth: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#6b7280' }}>
              <span>Subtotal</span>
              <span style={{ color: '#374151' }}>{fmt(subtotal)}</span>
            </div>
            {applyTax && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#6b7280' }}>
                <span>IVA ({taxRate}%)</span>
                <span style={{ color: '#374151' }}>{fmt(taxAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', fontSize: '15px', fontWeight: '700', background: '#3b82f6', color: 'white', borderRadius: '8px', marginTop: '8px' }}>
              <span>TOTAL</span>
              <span>{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div style={{ marginBottom: '20px', padding: '12px', background: '#fffbeb', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Notas</p>
            <p style={{ fontSize: '12px', color: '#78350f', margin: 0, whiteSpace: 'pre-wrap' }}>{notes}</p>
          </div>
        )}

        {/* Bank data & QR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
          {settings.bankName && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 8px 0', letterSpacing: '0.05em' }}>Datos bancarios</p>
              <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.6 }}>
                <p style={{ margin: '2px 0' }}><strong>Banco:</strong> {settings.bankName}</p>
                {settings.bankAccount && <p style={{ margin: '2px 0' }}><strong>Cuenta:</strong> {settings.bankAccount}</p>}
                {settings.bankClabe && <p style={{ margin: '2px 0' }}><strong>CLABE:</strong> {settings.bankClabe}</p>}
                {settings.bankBeneficiary && <p style={{ margin: '2px 0' }}><strong>Beneficiario:</strong> {settings.bankBeneficiary}</p>}
              </div>
            </div>
          )}
          {settings.qrUrl && (
            <div style={{ textAlign: 'center' }}>
              <img src={settings.qrUrl} alt="QR de pago" style={{ width: '100px', height: '100px', borderRadius: '8px' }} />
              <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>Escanea para pagar</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', color: '#9ca3af' }}>
            {settings.businessName} — {settings.phone} — {settings.email}
          </p>
        </div>
      </div>
    </div>
  );
}
