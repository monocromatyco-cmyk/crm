import { useState } from 'react';
import { Material, MaterialMovement, Settings } from '../types';
import { genId } from '../store';
import {
  Search, Plus, Boxes, X, Trash2, ArrowDownToLine, ArrowUpFromLine,
  AlertTriangle, BarChart3, Package, MapPin, Truck, SlidersHorizontal,
} from 'lucide-react';

interface Props {
  materials: Material[];
  movements: MaterialMovement[];
  settings: Settings;
  onChangeMaterials: (materials: Material[]) => void;
  onChangeMovements: (movements: MaterialMovement[]) => void;
}

const CATEGORIES = ['General', 'Materia prima', 'Insumos', 'Empaques', 'Químicos', 'Herramientas', 'Otro'];

export default function MaterialsView({ materials, movements, settings, onChangeMaterials, onChangeMovements }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Material | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [movementModal, setMovementModal] = useState<{ material: Material; type: 'entrada' | 'salida' | 'ajuste' } | null>(null);
  const [movementQty, setMovementQty] = useState(0);
  const [movementNote, setMovementNote] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: settings.currency }).format(n);

  let filtered = materials.filter((m) => {
    const s = search.toLowerCase();
    return m.name.toLowerCase().includes(s) || m.category.toLowerCase().includes(s) || m.supplier.toLowerCase().includes(s);
  });

  if (filterCategory) {
    filtered = filtered.filter((m) => m.category === filterCategory);
  }

  if (showLowStock) {
    filtered = filtered.filter((m) => m.currentStock <= m.minStock);
  }

  const lowStockCount = materials.filter((m) => m.currentStock <= m.minStock).length;
  const totalValue = materials.reduce((s, m) => s + m.currentStock * m.unitCost, 0);
  const totalItems = materials.reduce((s, m) => s + m.currentStock, 0);

  function openNew() {
    setEditing({
      id: genId(), name: '', description: '', category: 'General',
      unit: 'pza', currentStock: 0, minStock: 0, unitCost: 0,
      supplier: '', location: '', lastRestocked: '',
      createdAt: new Date().toISOString(),
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

  function openMovement(material: Material, type: 'entrada' | 'salida' | 'ajuste') {
    setMovementModal({ material, type });
    setMovementQty(0);
    setMovementNote('');
  }

  function handleMovement() {
    if (!movementModal || movementQty <= 0) return;
    const { material, type } = movementModal;

    const mv: MaterialMovement = {
      id: genId(),
      materialId: material.id,
      type,
      quantity: movementQty,
      note: movementNote,
      date: new Date().toISOString(),
    };

    let newStock = material.currentStock;
    if (type === 'entrada') newStock += movementQty;
    else if (type === 'salida') newStock = Math.max(0, newStock - movementQty);
    else newStock = movementQty; // ajuste = set absolute

    const updatedMaterial = {
      ...material,
      currentStock: newStock,
      lastRestocked: type === 'entrada' ? new Date().toISOString() : material.lastRestocked,
    };

    onChangeMaterials(materials.map((m) => (m.id === material.id ? updatedMaterial : m)));
    onChangeMovements([mv, ...movements]);
    setMovementModal(null);
  }

  function getMaterialMovements(materialId: string) {
    return movements.filter((mv) => mv.materialId === materialId).slice(0, 10);
  }

  return (
    <div className="space-y-4 view-enter">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Boxes className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-500">Total materiales</span>
          </div>
          <p className="text-xl font-bold text-white">{materials.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-500">Unidades en stock</span>
          </div>
          <p className="text-xl font-bold text-white">{totalItems.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-slate-500">Valor total</span>
          </div>
          <p className="text-xl font-bold text-violet-400">{fmt(totalValue)}</p>
        </div>
        <div className={`glass-card p-4 ${lowStockCount > 0 ? 'border-amber-500/30' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className="text-xs text-slate-500">Stock bajo</span>
          </div>
          <p className={`text-xl font-bold ${lowStockCount > 0 ? 'text-amber-400' : 'text-white'}`}>{lowStockCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar materiales..." className="input-field pl-10" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field w-auto min-w-[140px]">
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`btn-secondary flex items-center gap-1.5 text-xs ${showLowStock ? 'border-amber-500/50 text-amber-400' : ''}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Stock bajo
        </button>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Boxes className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No hay materiales registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((m) => {
            const isLow = m.currentStock <= m.minStock;
            const stockPercent = m.minStock > 0 ? Math.min((m.currentStock / (m.minStock * 3)) * 100, 100) : 100;
            return (
              <div
                key={m.id}
                className={`glass-card p-4 hover:border-blue-500/30 transition-all duration-200 cursor-pointer ${isLow ? 'border-amber-500/30' : ''}`}
                onClick={() => openEdit(m)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-200 truncate">{m.name}</p>
                      {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{m.category} · {m.unit}</p>
                    {m.supplier && <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5"><Truck className="w-3 h-3" />{m.supplier}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-lg font-bold ${isLow ? 'text-amber-400' : 'text-white'}`}>{m.currentStock}</p>
                    <p className="text-[10px] text-slate-600">mín: {m.minStock}</p>
                  </div>
                </div>

                {/* Stock bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isLow ? 'bg-amber-500' : stockPercent > 60 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${stockPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">{fmt(m.unitCost)} / {m.unit}</span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openMovement(m, 'entrada')} className="p-1.5 hover:bg-emerald-500/20 rounded-lg transition-colors" title="Entrada">
                      <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                    <button onClick={() => openMovement(m, 'salida')} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors" title="Salida">
                      <ArrowUpFromLine className="w-3.5 h-3.5 text-red-400" />
                    </button>
                    <button onClick={() => openMovement(m, 'ajuste')} className="p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors" title="Ajuste">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Movement Modal */}
      {movementModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {movementModal.type === 'entrada' && <><ArrowDownToLine className="w-5 h-5 text-emerald-400" /> Entrada</>}
                {movementModal.type === 'salida' && <><ArrowUpFromLine className="w-5 h-5 text-red-400" /> Salida</>}
                {movementModal.type === 'ajuste' && <><SlidersHorizontal className="w-5 h-5 text-blue-400" /> Ajuste</>}
              </h2>
              <button onClick={() => setMovementModal(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <p className="text-sm text-slate-400">{movementModal.material.name}</p>
            <p className="text-xs text-slate-500">Stock actual: <span className="text-white font-semibold">{movementModal.material.currentStock} {movementModal.material.unit}</span></p>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">
                {movementModal.type === 'ajuste' ? 'Nuevo stock' : 'Cantidad'}
              </label>
              <input type="number" value={movementQty || ''} onChange={(e) => setMovementQty(Number(e.target.value))} className="input-field" placeholder="0" autoFocus />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Nota (opcional)</label>
              <input value={movementNote} onChange={(e) => setMovementNote(e.target.value)} className="input-field" placeholder="Razón del movimiento..." />
            </div>

            <div className="flex gap-2">
              <button onClick={handleMovement} className="btn-primary flex-1">Confirmar</button>
              <button onClick={() => setMovementModal(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
          <div className="glass-card w-full max-w-lg my-8 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{isNew ? 'Nuevo material' : 'Editar material'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Nombre *</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="input-field" placeholder="Nombre del material" />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Descripción</label>
              <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="input-field min-h-[60px] resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Categoría</label>
                <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="input-field">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Unidad</label>
                <input value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} className="input-field" placeholder="kg, lt, pza..." />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Stock actual</label>
                <input type="number" value={editing.currentStock || ''} onChange={(e) => setEditing({ ...editing, currentStock: Number(e.target.value) })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Stock mínimo</label>
                <input type="number" value={editing.minStock || ''} onChange={(e) => setEditing({ ...editing, minStock: Number(e.target.value) })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Costo unitario</label>
                <input type="number" value={editing.unitCost || ''} onChange={(e) => setEditing({ ...editing, unitCost: Number(e.target.value) })} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block flex items-center gap-1"><Truck className="w-3 h-3" /> Proveedor</label>
                <input value={editing.supplier} onChange={(e) => setEditing({ ...editing, supplier: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3" /> Ubicación</label>
                <input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="input-field" placeholder="Almacén, estante..." />
              </div>
            </div>

            {/* Recent movements */}
            {!isNew && (
              <div className="space-y-2">
                <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Últimos movimientos</h3>
                {getMaterialMovements(editing.id).length === 0 ? (
                  <p className="text-xs text-slate-600">Sin movimientos</p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                    {getMaterialMovements(editing.id).map((mv) => (
                      <div key={mv.id} className="flex items-center gap-2 text-xs p-2 glass-card-light rounded-lg">
                        <span className={`status-badge text-[10px] ${
                          mv.type === 'entrada' ? 'bg-emerald-500/20 text-emerald-400' :
                          mv.type === 'salida' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {mv.type}
                        </span>
                        <span className="text-slate-300 font-semibold">{mv.quantity}</span>
                        {mv.note && <span className="text-slate-500 truncate flex-1">{mv.note}</span>}
                        <span className="text-slate-600 shrink-0">{new Date(mv.date).toLocaleDateString('es-MX')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
              {!isNew && (
                <button onClick={() => handleDelete(editing.id)} className="btn-danger flex items-center gap-1"><Trash2 className="w-4 h-4" /></button>
              )}
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
