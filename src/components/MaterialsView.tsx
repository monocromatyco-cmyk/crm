import { useState } from 'react';
import { Material, MaterialMovement, Settings } from '../types';
import { genId } from '../store';
import { Search, Plus, Boxes, X, Trash2, ArrowDownToLine, ArrowUpFromLine, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  materials: Material[];
  movements: MaterialMovement[];
  settings: Settings;
  onChangeMaterials: (m: Material[]) => void;
  onChangeMovements: (m: MaterialMovement[]) => void;
}

export default function MaterialsView({ materials, movements, settings, onChangeMaterials, onChangeMovements }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Material | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [movementModal, setMovementModal] = useState<{ materialId: string; type: 'entrada' | 'salida' | 'ajuste' } | null>(null);
  const [movQty, setMovQty] = useState(0);
  const [movNote, setMovNote] = useState('');

  const _fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: settings.currency }).format(n);
  void _fmt;

  const filtered = materials.filter((m) => {
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
  });

  function openNew() {
    setEditing({
      id: genId(), name: '', description: '', category: '', unit: 'pza',
      currentStock: 0, minStock: 0, unitCost: 0, supplier: '', location: '',
      lastRestocked: '', createdAt: new Date().toISOString(),
    });
    setIsNew(true);
  }

  function openEdit(m: Material) {
    setEditing({ ...m });
    setIsNew(false);
  }

  function handleSave() {
    if (!editing || !editing.name.trim()) return;
    if (isNew) {
      onChangeMaterials([editing, ...materials]);
    } else {
      onChangeMaterials(materials.map((m) => (m.id === editing.id ? editing : m)));
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar este material?')) {
      onChangeMaterials(materials.filter((m) => m.id !== id));
      onChangeMovements(movements.filter((mv) => mv.materialId !== id));
      setEditing(null);
    }
  }

  function handleMovement() {
    if (!movementModal || movQty <= 0) return;
    const mat = materials.find(m => m.id === movementModal.materialId);
    if (!mat) return;

    let newStock = mat.currentStock;
    if (movementModal.type === 'entrada') newStock += movQty;
    else if (movementModal.type === 'salida') newStock = Math.max(0, newStock - movQty);
    else newStock = movQty;

    const updatedMat = { ...mat, currentStock: newStock, lastRestocked: movementModal.type === 'entrada' ? new Date().toISOString() : mat.lastRestocked };
    onChangeMaterials(materials.map(m => m.id === mat.id ? updatedMat : m));

    const mov: MaterialMovement = {
      id: genId(), materialId: mat.id, type: movementModal.type,
      quantity: movQty, note: movNote, date: new Date().toISOString(),
    };
    onChangeMovements([mov, ...movements]);
    setMovementModal(null);
    setMovQty(0);
    setMovNote('');
  }

  return (
    <div className="space-y-4 view-enter">
      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar materiales..." className="input-field pl-10" />
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {/* Low stock alerts */}
      {materials.filter(m => m.currentStock <= m.minStock && m.minStock > 0).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
            <AlertTriangle className="w-4 h-4" /> Stock bajo
          </div>
          <div className="flex flex-wrap gap-2">
            {materials.filter(m => m.currentStock <= m.minStock && m.minStock > 0).map(m => (
              <span key={m.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">{m.name}: {m.currentStock} {m.unit}</span>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card-base p-12 text-center">
          <Boxes className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay materiales registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((m) => (
            <div key={m.id} className="card-base p-4 hover:border-blue-300 transition-all duration-200 cursor-pointer" onClick={() => openEdit(m)}>
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{m.name}</p>
                  {m.category && <p className="text-xs text-gray-500">{m.category}</p>}
                </div>
                <div className={`text-right ${m.currentStock <= m.minStock && m.minStock > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                  <p className="text-lg font-bold">{m.currentStock}</p>
                  <p className="text-[10px] text-gray-500">{m.unit}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); setMovementModal({ materialId: m.id, type: 'entrada' }); }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                  <ArrowDownToLine className="w-3 h-3" /> Entrada
                </button>
                <button onClick={(e) => { e.stopPropagation(); setMovementModal({ materialId: m.id, type: 'salida' }); }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  <ArrowUpFromLine className="w-3 h-3" /> Salida
                </button>
                <button onClick={(e) => { e.stopPropagation(); setMovementModal({ materialId: m.id, type: 'ajuste' }); }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <RefreshCw className="w-3 h-3" /> Ajuste
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Movement Modal */}
      {movementModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-base w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 capitalize">{movementModal.type}</h2>
              <button onClick={() => setMovementModal(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Cantidad</label>
              <input type="number" value={movQty || ''} onChange={(e) => setMovQty(Number(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Nota</label>
              <input value={movNote} onChange={(e) => setMovNote(e.target.value)} className="input-field" />
            </div>
            <button onClick={handleMovement} className="btn-primary w-full">Confirmar</button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
          <div className="card-base w-full max-w-lg my-8 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{isNew ? 'Nuevo material' : 'Editar material'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium mb-1 block">Nombre *</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium mb-1 block">Descripción</label>
                <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="input-field min-h-[60px] resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Categoría</label>
                <input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Unidad</label>
                <input value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Stock actual</label>
                <input type="number" value={editing.currentStock || ''} onChange={(e) => setEditing({ ...editing, currentStock: Number(e.target.value) })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Stock mínimo</label>
                <input type="number" value={editing.minStock || ''} onChange={(e) => setEditing({ ...editing, minStock: Number(e.target.value) })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Costo unitario</label>
                <input type="number" value={editing.unitCost || ''} onChange={(e) => setEditing({ ...editing, unitCost: Number(e.target.value) })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Proveedor</label>
                <input value={editing.supplier} onChange={(e) => setEditing({ ...editing, supplier: e.target.value })} className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium mb-1 block">Ubicación</label>
                <input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="input-field" />
              </div>
            </div>

            {/* Recent movements for this material */}
            {!isNew && (
              <div>
                <label className="text-xs text-gray-500 font-medium mb-2 block">Últimos movimientos</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {movements.filter(mv => mv.materialId === editing.id).slice(0, 10).map(mv => (
                    <div key={mv.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-100">
                      <span className={`font-medium ${mv.type === 'entrada' ? 'text-emerald-600' : mv.type === 'salida' ? 'text-red-600' : 'text-blue-600'}`}>
                        {mv.type === 'entrada' ? '+' : mv.type === 'salida' ? '-' : '='}{mv.quantity}
                      </span>
                      <span className="text-gray-500">{mv.note || mv.type}</span>
                      <span className="text-gray-400">{new Date(mv.date).toLocaleDateString('es-MX')}</span>
                    </div>
                  ))}
                  {movements.filter(mv => mv.materialId === editing.id).length === 0 && (
                    <p className="text-xs text-gray-400">Sin movimientos</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
              {!isNew && (
                <button onClick={() => handleDelete(editing.id)} className="btn-danger flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
