import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Package } from 'lucide-react';
import { Service } from '../types';
import { genId } from '../store';

interface Props {
  services: Service[];
  currency: string;
  onChange: (services: Service[]) => void;
}

function emptyService(): Service {
  return { id: genId(), name: '', description: '', unit: 'pza', basePrice: 0, createdAt: new Date().toISOString() };
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
    setEditing(emptyService());
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
      <div className="flex flex-col sm:flex-row gap-3">
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
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Nuevo servicio
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay servicios registrados</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-slate-800">{s.name}</p>
                {s.description && <p className="text-xs text-slate-500 truncate">{s.description}</p>}
                <div className="flex gap-3 mt-1 text-xs text-slate-400">
                  <span>{s.unit}</span>
                  <span className="font-medium text-slate-600">{fmt(s.basePrice)}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(s)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <Edit2 className="w-4 h-4 text-slate-400" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-2 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="font-bold text-lg text-slate-800">{isNew ? 'Nuevo servicio' : 'Editar servicio'}</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="input-field"
                  placeholder="Diseño web"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unidad</label>
                  <select
                    value={editing.unit}
                    onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                    className="input-field"
                  >
                    <option value="pza">pza</option>
                    <option value="hr">hr</option>
                    <option value="servicio">servicio</option>
                    <option value="proyecto">proyecto</option>
                    <option value="mes">mes</option>
                    <option value="kg">kg</option>
                    <option value="m2">m²</option>
                    <option value="otro">otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Precio base</label>
                  <input
                    type="number"
                    value={editing.basePrice}
                    onChange={(e) => setEditing({ ...editing, basePrice: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-200">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
