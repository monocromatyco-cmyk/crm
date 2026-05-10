import { useState, useRef } from 'react';
import { Settings as SettingsIcon, Building, DollarSign, Landmark, Upload, Trash2, CheckCircle, QrCode, RefreshCw } from 'lucide-react';
import { Settings } from '../types';
import { isFirebaseEnabled } from '../firebase';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export default function SettingsView({ settings, onChange }: Props) {
  const [form, setForm] = useState<Settings>({ ...settings });
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    onChange(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleFileUpload(type: 'logo' | 'qr', file: File | null) {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 2MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (type === 'logo') {
        setForm({ ...form, logoUrl: dataUrl });
      } else {
        setForm({ ...form, qrUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  }

  function clearImage(type: 'logo' | 'qr') {
    if (type === 'logo') {
      setForm({ ...form, logoUrl: '' });
    } else {
      setForm({ ...form, qrUrl: '' });
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> Configuración guardada
        </div>
      )}

      {/* Sync status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-slate-700">Sincronización</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isFirebaseEnabled() ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <p className="text-sm text-slate-600">
            {isFirebaseEnabled()
              ? 'Conectado a la nube — los cambios se sincronizan entre dispositivos automáticamente.'
              : 'Solo almacenamiento local — configura Firebase para sincronizar entre dispositivos.'}
          </p>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          También se sincronizan los cambios entre pestañas del navegador mediante localStorage.
        </p>
      </div>

      {/* Logo & QR uploads */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-slate-700">Logo y QR de pagos</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Logo upload */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">Logo del negocio</label>
            {form.logoUrl ? (
              <div className="relative w-32 h-32">
                <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl border border-slate-200" />
              </div>
            ) : (
              <button
                onClick={() => logoInputRef.current?.click()}
                className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition"
              >
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs">Subir logo</span>
              </button>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('logo', e.target.files?.[0] || null)} />
            {form.logoUrl && (
              <button onClick={() => clearImage('logo')} className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Quitar logo
              </button>
            )}
          </div>

          {/* QR upload */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">QR de pagos</label>
            {form.qrUrl ? (
              <div className="relative w-32 h-32">
                <img src={form.qrUrl} alt="QR" className="w-full h-full object-contain rounded-xl border border-slate-200" />
              </div>
            ) : (
              <button
                onClick={() => qrInputRef.current?.click()}
                className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition"
              >
                <QrCode className="w-6 h-6 mb-1" />
                <span className="text-xs">Subir QR</span>
              </button>
            )}
            <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('qr', e.target.files?.[0] || null)} />
            {form.qrUrl && (
              <button onClick={() => clearImage('qr')} className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Quitar QR
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          El logo y QR aparecerán en las cotizaciones y órdenes de compra al generar PDF.
        </p>
      </div>

      {/* Business info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Building className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-slate-700">Información del negocio</h3>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre del negocio</label>
          <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Teléfono</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" type="email" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Dirección</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
        </div>
      </div>

      {/* Financial */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-slate-700">Configuración financiera</h3>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Moneda</label>
          <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input-field">
            <option value="MXN">MXN — Peso Mexicano</option>
            <option value="USD">USD — Dólar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="COP">COP — Peso Colombiano</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Tasa de IVA por defecto (%)</label>
          <input type="number" value={form.defaultTaxRate} onChange={(e) => setForm({ ...form, defaultTaxRate: Number(e.target.value) })} className="input-field" />
        </div>
      </div>

      {/* Bank */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Landmark className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-slate-700">Datos bancarios</h3>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Banco</label>
          <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Cuenta</label>
          <input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">CLABE</label>
          <input value={form.bankClabe} onChange={(e) => setForm({ ...form, bankClabe: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Beneficiario</label>
          <input value={form.bankBeneficiary} onChange={(e) => setForm({ ...form, bankBeneficiary: e.target.value })} className="input-field" />
        </div>
      </div>

      <button onClick={handleSave} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-sm flex items-center justify-center gap-2">
        <SettingsIcon className="w-4 h-4" /> Guardar configuración
      </button>
    </div>
  );
}
