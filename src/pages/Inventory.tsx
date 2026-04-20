import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Product } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  ArrowUpDown,
  Download,
  AlertCircle,
  Package
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Inventory() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category_id: 1, // Defaulting to one of the seeded categories
    price: '',
    min_stock: '5',
    unit: 'unidad'
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const fetchProducts = async () => {
    setIsRefreshing(true);
    const res = await fetch('/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setProducts(data);
    setIsRefreshing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          min_stock: parseInt(formData.min_stock),
          category_id: parseInt(formData.category_id.toString())
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ code: '', name: '', category_id: 1, price: '', min_stock: '5', unit: 'unidad' });
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventario & Kardex</h1>
          <p className="text-text-dim font-medium">Controla tus productos y almacenes centralizados.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-accent text-bg-dark px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <div className="glass-card overflow-hidden border-white/10">
        {/* Filters Bar */}
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between bg-white/5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-accent outline-none transition-all text-sm text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-text-dim hover:text-white transition-all">
              <Filter size={20} />
            </button>
            <button 
              onClick={fetchProducts}
              className={`p-2 text-text-dim hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <ArrowUpDown size={20} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-text-dim hover:text-white transition-all">
              <Download size={18} />
              Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="px-6 py-4 text-[10px] font-black text-text-dim uppercase tracking-widest">Código</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-dim uppercase tracking-widest">Producto</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-dim uppercase tracking-widest">Categoría</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-dim uppercase tracking-widest">Stock Hoy</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-dim uppercase tracking-widest">Precio</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-dim uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map((p) => {
                const isLow = p.total_stock < p.min_stock;
                return (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-[10px] font-black text-accent bg-accent/10 border border-accent/20 px-2 py-1 rounded tracking-widest uppercase">
                        {p.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{p.name}</span>
                        <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold">{p.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-text-dim">{p.category_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-sm ${isLow ? 'text-red-400' : 'text-white'}`}>
                          {p.total_stock}
                        </span>
                        {isLow && (
                          <div className="group/alert relative">
                            <AlertCircle size={14} className="text-red-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-white text-sm">${p.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-text-dim hover:text-accent transition-all">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 text-text-dim hover:text-red-400 transition-all">
                          <Trash2 size={16} />
                        </button>
                        <button className="p-2 text-text-dim hover:text-white transition-all">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="text-center py-20 opacity-30">
              <Package className="mx-auto text-text-dim mb-4" size={64} />
              <p className="text-text-dim font-black uppercase text-xs">No hay resultados</p>
            </div>
          )}
        </div>
      </div>

      {/* New Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card w-full max-w-lg p-8 border-white/10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0" />
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white tracking-tight">Agregar Nuevo Producto</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-dim hover:text-white transition-colors"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Código SKU</label>
                  <input
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-accent transition-all"
                    placeholder="PROD-001"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Categoría</label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-accent transition-all appearance-none"
                  >
                    <option value={1} className="bg-bg-dark">Bebidas</option>
                    <option value={2} className="bg-bg-dark">Alimentos</option>
                    <option value={3} className="bg-bg-dark">Limpieza</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Nombre del Producto</label>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-accent transition-all"
                  placeholder="Ej. Coca Cola 1.5L"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Precio</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-accent transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Stock Mín.</label>
                  <input
                    required
                    type="number"
                    value={formData.min_stock}
                    onChange={e => setFormData({ ...formData, min_stock: e.target.value })}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Unidad</label>
                  <input
                    required
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all text-center"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-[2] bg-accent text-bg-dark px-4 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
