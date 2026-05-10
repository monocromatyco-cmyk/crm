import { useState } from 'react';
import { Search, Plus, Package, Trash2, X } from 'lucide-react';
import { Service } from '../types';
import { genId } from '../store';

interface Props {
  services: Service[];
  currency: string;
  onChange: (services: Service[]) => void;
}

export default function ServicesView({ services, currency, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n);

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
  });

  function openNew() {
    setEditing({
      id: genId(),
      name: '',
      description: '',
      unit: 'servicio',
      basePrice: 0,
      createdAt: new Date().toISOString(),
    });
    setIsNew(true);
  }

  function openEdit(s: Service) {
    setEditing({ ...s });
    setIsNew(false);
  }

  function handleSave() {
    if (!editing || !editing.name.trim()) return;
    if (isNew) {
      onChange([editing, ...services]);
    } else {
      onChange(services.map((s) => (s.id === editing.id ? editing : s)));
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar este servicio?')) {
      onChange(services.filter((s) => s.id !== id));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar servicios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm">
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          No hay servicios registrados
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} onClick={() => openEdit(s)} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition cursor-pointer flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{s.name}</p>
                {s.description && <p className="text-sm text-slate-500 truncate">{s.description}</p>}
                <p className="text-sm text-slate-500 mt-0.5">
                  <span className="text-blue-600 font-medium">{s.unit}</span> · {fmt(s.basePrice)}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                className="p-1.5 text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="font-bold text-lg text-slate-800">{isNew ? 'Nuevo servicio' : 'Editar servicio'}</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre *</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="input-field"
                  placeholder="Diseño web"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Descripción</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="input-field min-h-[60px]"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Unidad</label>
                  <input
                    value={editing.unit}
                    onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                    className="input-field"
                    placeholder="servicio"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Precio base</label>
                  <input
                    type="number"
                    value={editing.basePrice}
                    onChange={(e) => setEditing({ ...editing, basePrice: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-slate-200">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition">
                {isNew ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
