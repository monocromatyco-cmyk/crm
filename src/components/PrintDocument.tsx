import { useRef, useState } from 'react';
import { Quote, Receipt, Settings } from '../types';
import { X, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

interface Props {
  type: 'quote' | 'receipt';
  quote?: Quote;
  receipt?: Receipt;
  settings: Settings;
  onClose: () => void;
}

export default function PrintDocument({ type, quote, receipt, settings, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: settings.currency }).format(n);

  async function generatePDF() {
    if (!printRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const docNumber = type === 'quote' ? quote?.quoteNumber : receipt?.receiptNumber;
      pdf.save(`${docNumber || 'documento'}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
    setGenerating(false);
  }

  const items = type === 'quote' ? quote?.items || [] : receipt?.items || [];
  const docNumber = type === 'quote' ? quote?.quoteNumber : receipt?.receiptNumber;
  const docTitle = type === 'quote' ? 'COTIZACIÓN' : 'ORDEN DE COMPRA';
  const clientName = type === 'quote' ? quote?.clientName : receipt?.clientName;
  const subtotal = type === 'quote' ? quote?.subtotal || 0 : receipt?.subtotal || 0;
  const applyTax = type === 'quote' ? quote?.applyTax : receipt?.applyTax;
  const taxRate = type === 'quote' ? quote?.taxRate || 0 : receipt?.taxRate || 0;
  const taxAmount = type === 'quote' ? quote?.taxAmount || 0 : receipt?.taxAmount || 0;
  const total = type === 'quote' ? quote?.total || 0 : receipt?.total || 0;
  const notes = type === 'quote' ? quote?.notes : receipt?.notes;
  const dateStr = type === 'quote'
    ? new Date(quote?.createdAt || '').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date(receipt?.issuedAt || receipt?.createdAt || '').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-3xl my-8">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Vista previa</h2>
          <div className="flex gap-2">
            <button
              onClick={generatePDF}
              disabled={generating}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {generating ? 'Generando...' : 'Descargar PDF'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors bg-white border border-gray-200">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Document preview — clean design with horizontal lines only */}
        <div ref={printRef} className="bg-white shadow-lg" style={{ fontFamily: "'Sora', sans-serif", padding: '48px 40px', minHeight: '800px' }}>
          
          {/* Top accent line */}
          <div style={{ height: '3px', background: 'linear-gradient(to right, #2563eb, #3b82f6, #93c5fd)', marginBottom: '32px' }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" style={{ height: '48px', objectFit: 'contain', marginBottom: '8px' }} crossOrigin="anonymous" />
              ) : (
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                  {settings.businessName || 'Órbita CRM'}
                </div>
              )}
              {settings.logoUrl && (
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                  {settings.businessName}
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', lineHeight: '1.6' }}>
                {settings.phone && <div>{settings.phone}</div>}
                {settings.email && <div>{settings.email}</div>}
                {settings.address && <div>{settings.address}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#2563eb', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {docTitle}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginTop: '2px' }}>
                {docNumber}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                {dateStr}
              </div>
              {type === 'quote' && quote?.validUntil && (
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                  Vigencia: {new Date(quote.validUntil).toLocaleDateString('es-MX')}
                </div>
              )}
              {type === 'quote' && quote?.status && (
                <div style={{
                  fontSize: '10px', fontWeight: '600', marginTop: '6px',
                  color: quote.status === 'aceptada' ? '#059669' : quote.status === 'rechazada' ? '#dc2626' : '#6b7280',
                  textTransform: 'uppercase', letterSpacing: '1px',
                }}>
                  {quote.status}
                </div>
              )}
            </div>
          </div>

          {/* Thin separator */}
          <div style={{ height: '1px', backgroundColor: '#e5e7eb', marginBottom: '20px' }} />

          {/* Client info */}
          {clientName && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '9px', fontWeight: '600', color: '#9ca3af', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  CLIENTE
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {clientName}
                </div>
              </div>
              {/* Light separator */}
              <div style={{ height: '1px', backgroundColor: '#f3f4f6', marginBottom: '24px' }} />
            </>
          )}

          {type === 'quote' && quote?.title && (
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '20px' }}>
              {quote.title}
            </div>
          )}

          {/* Items table header */}
          <div style={{ display: 'flex', borderBottom: '2px solid #d1d5db', paddingBottom: '8px', marginBottom: '0' }}>
            <div style={{ flex: '3', fontSize: '9px', fontWeight: '700', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase' }}>Descripción</div>
            <div style={{ flex: '1', fontSize: '9px', fontWeight: '700', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center' }}>Cant.</div>
            <div style={{ flex: '1', fontSize: '9px', fontWeight: '700', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center' }}>Unidad</div>
            <div style={{ flex: '1.2', fontSize: '9px', fontWeight: '700', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>P. Unit.</div>
            <div style={{ flex: '1.2', fontSize: '9px', fontWeight: '700', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Total</div>
          </div>

          {/* Items rows */}
          {items.map((item, idx) => (
            <div key={item.id || idx} style={{
              display: 'flex', alignItems: 'center', padding: '10px 0',
              borderBottom: idx === items.length - 1 ? '2px solid #9ca3af' : '1px solid #f3f4f6',
            }}>
              <div style={{ flex: '3', fontSize: '12px', color: '#374151' }}>{item.description}</div>
              <div style={{ flex: '1', fontSize: '12px', color: '#374151', textAlign: 'center' }}>{item.quantity}</div>
              <div style={{ flex: '1', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>{item.unit}</div>
              <div style={{ flex: '1.2', fontSize: '12px', color: '#374151', textAlign: 'right' }}>{fmt(item.unitPrice)}</div>
              <div style={{ flex: '1.2', fontSize: '12px', fontWeight: '600', color: '#111827', textAlign: 'right' }}>{fmt(item.lineTotal)}</div>
            </div>
          ))}

          {/* Totals section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <div style={{ width: '260px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Subtotal</span>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>{fmt(subtotal)}</span>
              </div>
              {applyTax && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>IVA ({taxRate}%)</span>
                  <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>{fmt(taxAmount)}</span>
                </div>
              )}
              {/* Blue accent line before total */}
              <div style={{ height: '2px', background: '#2563eb', marginTop: '4px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>Total</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Payments (receipts only) */}
          {type === 'receipt' && receipt?.payments && receipt.payments.length > 0 && (
            <>
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '24px 0 16px' }} />
              <div style={{ fontSize: '9px', fontWeight: '600', color: '#9ca3af', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
                PAGOS REGISTRADOS
              </div>
              {receipt.payments.map((p, idx) => (
                <div key={p.id || idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #f3f4f6',
                }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>{fmt(p.amount)}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '8px' }}>{p.method}</span>
                    {p.note && <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '8px' }}>— {p.note}</span>}
                  </div>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{new Date(p.paidAt).toLocaleDateString('es-MX')}</span>
                </div>
              ))}
              {/* Balance line */}
              <div style={{ height: '1px', backgroundColor: '#d1d5db', marginTop: '4px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: receipt.balance <= 0 ? '#059669' : '#d97706' }}>
                  {receipt.balance <= 0 ? 'PAGADO' : `Saldo pendiente: ${fmt(receipt.balance)}`}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  Total pagado: {fmt(receipt.paidAmount)}
                </span>
              </div>
            </>
          )}

          {/* Notes */}
          {notes && (
            <>
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '24px 0 16px' }} />
              <div style={{ fontSize: '9px', fontWeight: '600', color: '#9ca3af', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                NOTAS
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {notes}
              </div>
            </>
          )}

          {/* Bank info */}
          {(settings.bankName || settings.bankAccount || settings.bankClabe) && (
            <>
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '24px 0 16px' }} />
              <div style={{ fontSize: '9px', fontWeight: '600', color: '#9ca3af', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                DATOS BANCARIOS
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.8' }}>
                  {settings.bankName && <div><span style={{ color: '#9ca3af' }}>Banco:</span> {settings.bankName}</div>}
                  {settings.bankBeneficiary && <div><span style={{ color: '#9ca3af' }}>Beneficiario:</span> {settings.bankBeneficiary}</div>}
                  {settings.bankAccount && <div><span style={{ color: '#9ca3af' }}>Cuenta:</span> {settings.bankAccount}</div>}
                  {settings.bankClabe && <div><span style={{ color: '#9ca3af' }}>CLABE:</span> {settings.bankClabe}</div>}
                </div>
                {settings.qrUrl && (
                  <img src={settings.qrUrl} alt="QR de pago" style={{ width: '80px', height: '80px', objectFit: 'contain' }} crossOrigin="anonymous" />
                )}
              </div>
            </>
          )}

          {/* Footer line */}
          <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '32px 0 12px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '10px', color: '#9ca3af' }}>
              {settings.businessName || 'Órbita CRM'}
            </div>
            <div style={{ fontSize: '10px', color: '#9ca3af' }}>
              {settings.phone} {settings.email ? `· ${settings.email}` : ''}
            </div>
          </div>
          {/* Bottom accent line */}
          <div style={{ height: '2px', background: 'linear-gradient(to right, #93c5fd, #2563eb, #93c5fd)', marginTop: '12px' }} />
        </div>
      </div>
    </div>
  );
}
