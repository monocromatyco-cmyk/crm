import { useState } from 'react';
import { Settings } from '../types';
import { Save, Building2, Phone, Mail, MapPin, Globe, Percent, CreditCard, QrCode, Image } from 'lucide-react';
import { isFirebaseEnabled } from '../firebase';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export default function SettingsView({ settings, onChange }: Props) {
  const [form, setForm] = useState<Settings>({ ...settings });

  function handleSave() {
    onChange(form);
  }

  return (
    <div className="space-y-6 view-enter max-w-2xl">
      <div className="card-base p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Datos del negocio</h2>

        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">Nombre del negocio</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="input-field pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field pl-10" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field pl-10" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">Dirección</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">URL del logo</label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className="input-field pl-10" placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">URL del QR de pago</label>
            <div className="relative">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.qrUrl} onChange={(e) => setForm({ ...form, qrUrl: e.target.value })} className="input-field pl-10" placeholder="https://..." />
            </div>
          </div>
        </div>
      </div>

      <div className="card-base p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Moneda e impuestos</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Moneda</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input-field pl-10" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">IVA por defecto (%)</label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="number" value={form.defaultTaxRate} onChange={(e) => setForm({ ...form, defaultTaxRate: Number(e.target.value) })} className="input-field pl-10" />
            </div>
          </div>
        </div>
      </div>

      <div className="card-base p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Datos bancarios</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Banco</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="input-field pl-10" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Beneficiario</label>
            <input value={form.bankBeneficiary} onChange={(e) => setForm({ ...form, bankBeneficiary: e.target.value })} className="input-field" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">No. de cuenta</label>
            <input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">CLABE</label>
            <input value={form.bankClabe} onChange={(e) => setForm({ ...form, bankClabe: e.target.value })} className="input-field" />
          </div>
        </div>
      </div>

      {/* Sync status */}
      <div className="card-base p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Sincronización</h2>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isFirebaseEnabled() ? 'bg-emerald-500' : 'bg-red-400'}`} />
          <p className="text-sm text-gray-600">
            Firebase: {isFirebaseEnabled() ? 'Conectado — los datos se sincronizan entre dispositivos' : 'No disponible — solo almacenamiento local'}
          </p>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary flex items-center gap-2 w-full justify-center">
        <Save className="w-4 h-4" /> Guardar configuración
      </button>
    </div>
  );
}
