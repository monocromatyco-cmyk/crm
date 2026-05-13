import { useState } from 'react';
import { Service, Settings } from '../types';
import { genId } from '../store';
import { Search, Plus, Package, X, Trash2 } from 'lucide-react';

interface Props {
  services: Service[];
  settings: Settings;
  onChange: (services: Service[]) => void;
}

export default function ServicesView({ services, settings, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: settings.currency }).format(n);

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
  });

  function openNew() {
    setEditing({
      id: genId(), name: '', description: '', unit: 'servicio', basePrice: 0,
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
      setEditing(null);
    }
  }

  return (
    <div className="space-y-4 view-enter">
      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar servicios..."
            className="input-field pl-10"
          />
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No hay servicios registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              onClick={() => openEdit(s)}
              className="glass-card p-4 hover:border-blue-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{s.name}</p>
                {s.description && <p className="text-xs text-slate-500 truncate mt-0.5">{s.description}</p>}
                <p className="text-xs text-slate-500 mt-1">{s.unit} · <span className="text-blue-400 font-semibold">{fmt(s.basePrice)}</span></p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
          <div className="glass-card w-full max-w-md my-8 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{isNew ? 'Nuevo servicio' : 'Editar servicio'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Nombre *</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="input-field" placeholder="Diseño web" />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Descripción</label>
              <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="input-field min-h-[80px] resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Unidad</label>
                <input value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} className="input-field" placeholder="servicio" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Precio base</label>
                <input type="number" value={editing.basePrice || ''} onChange={(e) => setEditing({ ...editing, basePrice: Number(e.target.value) })} className="input-field" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
              {!isNew && (
                <button onClick={() => handleDelete(editing.id)} className="btn-danger flex items-center gap-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
