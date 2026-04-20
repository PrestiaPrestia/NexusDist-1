import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Product } from '../types';
import { 
  Smartphone, 
  MapPin, 
  ShoppingCart, 
  Search, 
  Plus, 
  CheckCircle2,
  Package,
  History,
  Users,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MobileSeller() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ id: number, quantity: number }[]>([]);
  const [location, setLocation] = useState<{ lat: number, lon: number } | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setProducts);

    // Initial Geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
      });
    }
  }, [token]);

  const addToCart = (id: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing) return prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id, quantity: 1 }];
    });
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) return;
    setIsOrdering(true);
    // Simulating real-time sync
    setTimeout(() => {
      setCart([]);
      setIsOrdering(false);
      alert('Pedido sincronizado correctamente con la central.');
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto glass-card min-h-[calc(100vh-140px)] border-white/10 shadow-2xl overflow-hidden flex flex-col relative">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0" />
      
      {/* Mobile Top Bar */}
      <div className="bg-white/5 p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-xl text-accent border border-accent/20">
              <Smartphone size={20} />
            </div>
            <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">Canal Preventa</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] bg-black/40 border border-white/10 px-3 py-1.5 rounded-full text-white font-black uppercase tracking-tighter">
            <MapPin size={10} className="text-accent" />
            {location ? `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}` : 'Sinc. GPS...'}
          </div>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tighter drop-shadow-lg">Hola, {user?.full_name.split(' ')[0]}</h2>
        <p className="text-[11px] font-bold text-accent uppercase tracking-widest mt-1 opacity-80">Ruta: Sector Norte • Lunes</p>
      </div>

      {/* Stats Mini */}
      <div className="flex gap-4 p-6 overflow-x-auto no-scrollbar relative z-10">
         <div className="min-w-[140px] glass-card p-4 border-white/10 shadow-lg bg-white/5">
           <p className="text-[9px] text-text-dim font-black uppercase tracking-widest mb-1 opacity-60">Meta Diaria</p>
           <p className="text-xl font-black text-white tracking-tighter">$1,200</p>
         </div>
         <div className="min-w-[140px] glass-card p-4 border-white/10 shadow-lg bg-white/5">
           <p className="text-[9px] text-text-dim font-black uppercase tracking-widest mb-1 opacity-60">Avance Ruta</p>
           <div className="flex items-baseline gap-1">
             <p className="text-xl font-black text-green-400 tracking-tighter">65%</p>
             <TrendingUp size={12} className="text-green-400 opacity-60" />
           </div>
         </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/60" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por SKU o nombre..."
            className="w-full pl-12 pr-4 py-3.5 bg-black/30 border border-white/10 rounded-2xl text-sm text-white placeholder:text-text-dim/30 font-medium outline-none focus:ring-1 focus:ring-accent transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] opacity-40">Catálogo en Tiempo Real</span>
          <div className="h-[1px] flex-1 bg-white/5 ml-4" />
        </div>

        {products.map(p => (
          <motion.div 
            key={p.id}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl group transition-all"
          >
            <div className="w-14 h-14 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center text-text-dim/40 group-active:text-accent group-active:border-accent/30 transition-all shadow-inner">
               <Package size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate leading-tight">{p.name}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-lg font-black text-accent tracking-tighter italic">${p.price}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${p.total_stock > 10 ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
                  STOCK: {p.total_stock}
                </span>
              </div>
            </div>
            <button 
              onClick={() => addToCart(p.id)}
              className="w-10 h-10 rounded-xl bg-accent text-bg-dark flex items-center justify-center shadow-lg shadow-accent/20 active:scale-90 transition-all border border-white/20"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Footer Order Info */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            className="p-6 pb-10 bg-black/40 border-t border-white/10 backdrop-blur-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-20"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-accent text-bg-dark p-3 rounded-xl shadow-lg shadow-accent/20">
                  <ShoppingCart size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-base font-bold text-white">{cart.length} productos en lista</p>
                  <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-0.5">Pendiente de envío</p>
                </div>
              </div>
              <button onClick={() => setCart([])} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:brightness-125">Borrar</button>
            </div>
            <button 
              onClick={handleCreateOrder}
              disabled={isOrdering}
              className="w-full bg-accent text-bg-dark py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-accent/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-white/20"
            >
              {isOrdering ? (
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-bg-dark rounded-full animate-ping" />
                  Sincronizando...
                </span>
              ) : (
                <>
                  <CheckCircle2 size={20} strokeWidth={3} />
                  Enviar Pedido a Central
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Nav Stub */}
      <div className="p-5 bg-black/20 border-t border-white/10 flex items-center justify-around text-text-dim/40 relative z-30">
        <Package size={22} className="text-accent" />
        <History size={22} />
        <div className="w-14 h-14 bg-accent text-bg-dark rounded-full -mt-10 shadow-2xl shadow-accent/40 border-2 border-white/20 flex items-center justify-center font-black text-xs">
           POS
        </div>
        <Users size={22} />
        <TrendingUp size={22} />
      </div>
    </div>
  );
}
