import { useState, useRef } from 'react';
import { Save, CheckCircle, Upload, X, Building, Phone, Mail, MapPin, Landmark, CreditCard, Image } from 'lucide-react';
import { Settings } from '../types';

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
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle className="w-4 h-4" /> Configuración guardada
        </div>
      )}

      {/* Logo & QR uploads */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-lg text-slate-800">Logo y QR de pagos</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Logo del negocio</label>
            {form.logoUrl ? (
              <div className="relative w-32 h-32 border border-slate-200 rounded-xl overflow-hidden">
                <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <button
                onClick={() => logoInputRef.current?.click()}
                className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition"
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs">Subir logo</span>
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload('logo', e.target.files?.[0] || null)}
            />
            {form.logoUrl && (
              <button onClick={() => clearImage('logo')} className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                <X className="w-3 h-3" /> Quitar logo
              </button>
            )}
          </div>

          {/* QR upload */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">QR de pagos</label>
            {form.qrUrl ? (
              <div className="relative w-32 h-32 border border-slate-200 rounded-xl overflow-hidden">
                <img src={form.qrUrl} alt="QR" className="w-full h-full object-contain" />
              </div>
            ) : (
              <button
                onClick={() => qrInputRef.current?.click()}
                className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition"
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs">Subir QR</span>
              </button>
            )}
            <input
              ref={qrInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload('qr', e.target.files?.[0] || null)}
            />
            {form.qrUrl && (
              <button onClick={() => clearImage('qr')} className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                <X className="w-3 h-3" /> Quitar QR
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          El logo y QR aparecerán en las cotizaciones y órdenes de compra al imprimir o generar PDF.
        </p>
      </div>

      {/* Business info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-lg text-slate-800">Información del negocio</h3>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del negocio</label>
          <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Teléfono</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" type="email" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Dirección</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
        </div>
      </div>

      {/* Financial */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-lg text-slate-800">Configuración financiera</h3>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Moneda</label>
          <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input-field">
            <option value="MXN">MXN — Peso Mexicano</option>
            <option value="USD">USD — Dólar</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Tasa de IVA por defecto (%)</label>
          <input type="number" value={form.defaultTaxRate} onChange={(e) => setForm({ ...form, defaultTaxRate: Number(e.target.value) })} className="input-field" />
        </div>
      </div>

      {/* Bank */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Landmark className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-lg text-slate-800">Datos bancarios</h3>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Banco</label>
          <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Cuenta</label>
          <input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">CLABE</label>
          <input value={form.bankClabe} onChange={(e) => setForm({ ...form, bankClabe: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Beneficiario</label>
          <input value={form.bankBeneficiary} onChange={(e) => setForm({ ...form, bankBeneficiary: e.target.value })} className="input-field" />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition w-full justify-center"
      >
        <Save className="w-5 h-5" /> Guardar configuración
      </button>
    </div>
  );
}
