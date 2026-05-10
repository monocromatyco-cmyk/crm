import { useState, useRef } from 'react';
import { Save, Building2, Phone, Mail, MapPin, DollarSign, Landmark, CheckCircle, Upload, Image, QrCode, X } from 'lucide-react';
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

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 2MB.');
      return;
    }

    // Check file type
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
    <div className="max-w-2xl mx-auto space-y-6">
      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle className="w-4 h-4" /> Configuración guardada
        </div>
      )}

      {/* Logo & QR uploads */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold flex items-center gap-2 text-slate-800 mb-4">
          <Image className="w-5 h-5 text-blue-600" /> Logo y QR de pagos
        </h3>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Logo upload */}
          <div>
            <p className="text-sm text-slate-600 mb-2">Logo del negocio</p>
            {form.logoUrl ? (
              <div className="relative inline-block">
                <img src={form.logoUrl} alt="Logo" className="w-32 h-32 object-contain border border-slate-200 rounded-xl p-2" />
                <button
                  onClick={() => clearImage('logo')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
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
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload('logo', e.target.files?.[0] || null)}
            />
            {form.logoUrl && (
              <button
                onClick={() => logoInputRef.current?.click()}
                className="mt-2 text-xs text-blue-600 hover:text-blue-500"
              >
                Cambiar imagen
              </button>
            )}
          </div>

          {/* QR upload */}
          <div>
            <p className="text-sm text-slate-600 mb-2">QR de pagos</p>
            {form.qrUrl ? (
              <div className="relative inline-block">
                <img src={form.qrUrl} alt="QR" className="w-32 h-32 object-contain border border-slate-200 rounded-xl p-2" />
                <button
                  onClick={() => clearImage('qr')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
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
            <input
              ref={qrInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload('qr', e.target.files?.[0] || null)}
            />
            {form.qrUrl && (
              <button
                onClick={() => qrInputRef.current?.click()}
                className="mt-2 text-xs text-blue-600 hover:text-blue-500"
              >
                Cambiar imagen
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          El logo y QR aparecerán en las cotizaciones y órdenes de compra al imprimir o generar PDF.
        </p>
      </section>

      {/* Business info */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold flex items-center gap-2 text-slate-800">
          <Building2 className="w-5 h-5 text-blue-600" /> Información del negocio
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-slate-500 mb-1 block">Nombre del negocio</span>
            <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="input-field" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</span>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" type="email" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Dirección</span>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
          </label>
        </div>
      </section>

      {/* Financial */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold flex items-center gap-2 text-slate-800">
          <DollarSign className="w-5 h-5 text-emerald-600" /> Configuración financiera
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-slate-500 mb-1 block">Moneda</span>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input-field">
              <option value="MXN">MXN — Peso Mexicano</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="COP">COP — Peso Colombiano</option>
              <option value="ARS">ARS — Peso Argentino</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-500 mb-1 block">Tasa de IVA por defecto (%)</span>
            <input type="number" min={0} step="0.01" value={form.defaultTaxRate} onChange={(e) => setForm({ ...form, defaultTaxRate: Number(e.target.value) })} className="input-field" />
          </label>
        </div>
      </section>

      {/* Bank */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold flex items-center gap-2 text-slate-800">
          <Landmark className="w-5 h-5 text-sky-600" /> Datos bancarios
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-slate-500 mb-1 block">Banco</span>
            <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="input-field" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500 mb-1 block">Cuenta</span>
            <input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} className="input-field" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500 mb-1 block">CLABE</span>
            <input value={form.bankClabe} onChange={(e) => setForm({ ...form, bankClabe: e.target.value })} className="input-field" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500 mb-1 block">Beneficiario</span>
            <input value={form.bankBeneficiary} onChange={(e) => setForm({ ...form, bankBeneficiary: e.target.value })} className="input-field" />
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition">
          <Save className="w-4 h-4" /> Guardar configuración
        </button>
      </div>
    </div>
  );
}
