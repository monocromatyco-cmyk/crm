import { useState, useEffect } from 'react';
import { Settings } from '../types';
import { isFirebaseEnabled } from '../firebase';
import {
  Building2, Phone, Mail, MapPin, DollarSign, Landmark,
  Save, Image, QrCode, Cloud, CloudOff, CheckCircle2, Upload, X,
} from 'lucide-react';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export default function SettingsView({ settings, onChange }: Props) {
  const [form, setForm] = useState<Settings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  function handleSave() {
    onChange(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleFileUpload(field: 'logo' | 'qr', file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (field === 'logo') {
        setForm({ ...form, logoUrl: base64 });
      } else {
        setForm({ ...form, qrUrl: base64 });
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6 view-enter max-w-2xl">
      {/* Sync status */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-2">
          {isFirebaseEnabled() ? (
            <Cloud className="w-5 h-5 text-emerald-400" />
          ) : (
            <CloudOff className="w-5 h-5 text-amber-400" />
          )}
          <h3 className="text-sm font-semibold text-white">Sincronización</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {isFirebaseEnabled()
            ? 'Conectado a la nube — los cambios se sincronizan entre dispositivos automáticamente.'
            : 'Solo almacenamiento local — configura Firebase para sincronizar entre dispositivos.'}
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Los cambios también se sincronizan entre pestañas del navegador mediante localStorage.
        </p>
      </div>

      {/* Logo & QR uploads */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Logo y QR de pagos</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Logo */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium">Logo del negocio</label>
            {form.logoUrl ? (
              <div className="relative w-20 h-20">
                <img src={form.logoUrl} alt="Logo" className="w-20 h-20 object-contain rounded-xl border border-slate-700" />
                <button
                  onClick={() => setForm({ ...form, logoUrl: '' })}
                  className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-slate-600" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload('logo', e.target.files?.[0] || null)}
              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-300 file:text-xs file:cursor-pointer hover:file:bg-slate-700"
            />
          </div>

          {/* QR */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium flex items-center gap-1"><QrCode className="w-3 h-3" /> QR de pagos</label>
            {form.qrUrl ? (
              <div className="relative w-20 h-20">
                <img src={form.qrUrl} alt="QR" className="w-20 h-20 object-contain rounded-xl border border-slate-700" />
                <button
                  onClick={() => setForm({ ...form, qrUrl: '' })}
                  className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-slate-600" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload('qr', e.target.files?.[0] || null)}
              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-300 file:text-xs file:cursor-pointer hover:file:bg-slate-700"
            />
          </div>
        </div>
        <p className="text-xs text-slate-600">El logo y QR aparecerán en las cotizaciones y órdenes de compra al generar PDF.</p>
      </div>

      {/* Business info */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Información del negocio</h3>
        </div>

        <div>
          <label className="text-xs text-slate-400 font-medium mb-1 block">Nombre del negocio</label>
          <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="input-field" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" type="email" />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 font-medium mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3" /> Dirección</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
        </div>
      </div>

      {/* Financial */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Configuración financiera</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Moneda</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input-field">
              <option value="MXN">MXN — Peso mexicano</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Tasa de IVA por defecto (%)</label>
            <input type="number" value={form.defaultTaxRate} onChange={(e) => setForm({ ...form, defaultTaxRate: Number(e.target.value) })} className="input-field" />
          </div>
        </div>
      </div>

      {/* Bank */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Datos bancarios</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Banco</label>
            <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Cuenta</label>
            <input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">CLABE</label>
            <input value={form.bankClabe} onChange={(e) => setForm({ ...form, bankClabe: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Beneficiario</label>
            <input value={form.bankBeneficiary} onChange={(e) => setForm({ ...form, bankBeneficiary: e.target.value })} className="input-field" />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="sticky bottom-4">
        <button onClick={handleSave} className={`w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg ${saved ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-500/20 hover:from-blue-500 hover:to-blue-400'}`}>
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar cambios</>}
        </button>
      </div>
    </div>
  );
}
