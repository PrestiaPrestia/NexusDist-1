import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Product, Currency, SaleItem } from '../types';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard,
  Search,
  Package,
  CheckCircle2
} from 'lucide-react';

export default function Sales() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [docType, setDocType] = useState<'factura' | 'boleta'>('boleta');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/currencies', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      
      setProducts(Array.isArray(pData) ? pData : []);
      
      // cData ahora es un array directo de Supabase
      if (Array.isArray(cData)) {
        setCurrencies(cData);
        setSelectedCurrency(cData.find((c: any) => c.is_main) || cData[0] || null);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      const price = typeof product.price === 'number' ? product.price : 0;
      return [...prev, { product_id: product.id, name: product.name, quantity: 1, unit_price: price }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product_id === id) {
        return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const subtotal = cart.reduce((acc, i) => acc + (i.quantity * (i.unit_price || 0)), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const bodyData = {
        items: cart,
        doc_type: docType,
        currency_code: selectedCurrency?.code || 'USD',
        exchange_rate: 1.0, 
        client_id: 1 
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errorData.error || 'Error al procesar venta');
      }

      // IMPORTANTE: Limpiar estados de forma segura
      setCart([]);
      setSearchTerm('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (e: any) {
      console.error('Error en checkout:', e);
      alert('Error: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] animate-in fade-in duration-500">
      {/* Catalogo (Izquierda) */}
      <div className="flex-1 flex flex-col min-w-0 glass p-1 border-white/5 rounded-3xl overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white tracking-tight">Ventas</h1>
            {showSuccess && (
              <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold border border-green-500/30 flex items-center gap-2">
                <CheckCircle2 size={12} />
                ¡Éxito!
              </div>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={16} />
            <input 
              type="text" 
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:ring-accent outline-none text-white transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-max custom-scrollbar">
          {filteredProducts.map(p => (
            <button 
              key={p.id}
              onClick={() => addToCart(p)}
              className="group p-3 bg-white/5 border border-white/10 rounded-xl hover:border-accent/40 text-left transition-all relative overflow-hidden"
            >
              <p className="font-bold text-white text-sm mb-0.5">{p.name}</p>
              <p className="text-[9px] text-text-dim uppercase font-bold">{p.category_name || 'Sin Categoría'}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-black text-accent italic">{selectedCurrency?.symbol || '$'}{(p.price || 0).toLocaleString()}</span>
                <Plus size={14} className="text-text-dim group-hover:text-white" />
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-20">
               <Package size={48} className="mx-auto mb-4" />
               <p className="text-xs font-black uppercase">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Carrito (Derecha) */}
      <div className="lg:w-96 flex flex-col glass p-1 border-white/5 rounded-3xl overflow-hidden shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-accent" />
            <span className="font-bold text-white uppercase text-sm">Resumen</span>
          </div>
          <span className="text-[10px] font-bold text-text-dim uppercase">{cart.length} items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-white">
               <ShoppingCart size={48} className="mb-4" />
               <p className="text-xs font-bold uppercase">Carrito Vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product_id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{item.name}</p>
                  <p className="text-[10px] text-accent">{selectedCurrency?.symbol || '$'}{(item.unit_price || 0).toLocaleString()}</p>
                </div>
                <div className="flex items-center bg-black/20 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.product_id, -1)} className="w-6 h-6 flex items-center justify-center text-text-dim hover:text-white">
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, 1)} className="w-6 h-6 flex items-center justify-center text-text-dim hover:text-white">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-white/5 border-t border-white/10 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-body font-bold text-white">Subtotal</span>
            <span className="text-white font-bold">{selectedCurrency?.symbol || '$'}{(subtotal || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-white/10">
            <span className="text-white font-bold uppercase text-[10px]">Total</span>
            <span className="text-xl font-black text-accent">{selectedCurrency?.symbol || '$'}{(total || 0).toLocaleString()}</span>
          </div>

          <button 
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
            className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
              cart.length === 0 || isProcessing 
              ? 'bg-white/5 text-text-dim cursor-not-allowed' 
              : 'bg-accent text-bg-dark hover:brightness-110 active:scale-95 shadow-lg shadow-accent/20'
            }`}
          >
            {isProcessing ? 'Procesando...' : (
              <>
                <CreditCard size={16} />
                Confirmar Venta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
