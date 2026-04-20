import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Product, Currency, SaleItem } from '../types';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard,
  User as UserIcon,
  Search,
  DollarSign,
  FileText,
  Printer,
  ChevronRight,
  Calculator,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Sales() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [docType, setDocType] = useState<'factura' | 'boleta'>('boleta');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    const [pRes, cRes] = await Promise.all([
      fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/currencies', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    const pData = await pRes.json();
    const cData = await cRes.json();
    setProducts(pData);
    setCurrencies(cData.currencies);
    setSelectedCurrency(cData.currencies.find((c: any) => c.is_main) || cData.currencies[0]);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product_id: product.id, name: product.name, quantity: 1, unit_price: product.price }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product_id === id) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.product_id !== id));
  };

  const subtotal = cart.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart,
          doc_type: docType,
          currency_code: selectedCurrency?.code,
          exchange_rate: 1.0, 
          client_id: 1 
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al procesar venta');
      }

      const data = await res.json();
      
      // Pasar copia de los datos actuales para el PDF antes de limpiar el carrito
      const pdfData = {
        saleId: data.sale_id,
        items: [...cart],
        subtotal,
        tax,
        total,
        docType
      };

      try {
        generatePDF(pdfData);
      } catch (pdfError) {
        console.error('Error generando PDF:', pdfError);
      }

      alert('¡Venta realizada con éxito!');
      
      // Limpiar estado
      setCart([]);
    } catch (e: any) {
      console.error('Error en checkout:', e);
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDF = (data: any) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('NexusDist ERP - COMPROBANTE', 20, 20);
    doc.setFontSize(10);
    doc.text(`ID Venta: ${data.saleId}`, 20, 30);
    doc.text(`Tipo: ${data.docType.toUpperCase()}`, 20, 35);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 20, 40);

    const tableData = data.items.map((item: any) => [
      item.name,
      item.quantity,
      `$${item.unit_price.toFixed(2)}`,
      `$${(item.quantity * item.unit_price).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      startY: 50,
      theme: 'grid',
      headStyles: { fill: [56, 189, 248] }, // Accent color
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.text(`Subtotal: $${data.subtotal.toFixed(2)}`, 140, finalY + 10);
    doc.text(`IGV (18%): $${data.tax.toFixed(2)}`, 140, finalY + 15);
    doc.setFontSize(14);
    doc.text(`TOTAL: $${data.total.toFixed(2)}`, 140, finalY + 25);

    doc.save(`Venta_${data.saleId}.pdf`);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-160px)] pb-10">
      <div className="flex-1 flex flex-col min-w-0 glass-card border-white/10 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0" />
        <div className="p-6 border-b border-white/5 bg-white/5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Catálogo NexusDist</h2>
              <p className="text-text-dim text-[11px] font-extrabold uppercase tracking-widest mt-1 opacity-80">Distribución de Consumo Masivo</p>
            </div>
            <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10 shadow-inner">
               {currencies.map(c => (
                 <button 
                   key={c.code}
                   onClick={() => setSelectedCurrency(c)}
                   className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                     selectedCurrency?.code === c.code 
                       ? 'bg-accent text-bg-dark shadow-[0_0_20px_rgba(56,189,248,0.3)]' 
                       : 'text-text-dim hover:text-white'
                   }`}
                 >
                   {c.code}
                 </button>
               ))}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-black/30 border border-white/10 rounded-2xl focus:ring-1 focus:ring-accent outline-none font-medium text-sm text-white placeholder:text-text-dim/40 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max custom-scrollbar">
          {filteredProducts.map(p => (
            <motion.button 
              key={p.id}
              whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => addToCart(p)}
              className="group p-5 bg-white/5 border border-white/10 rounded-2xl transition-all hover:border-accent/40 text-left flex flex-col justify-between h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                 <Package size={40} className="text-text-dim" />
              </div>
              <div className="relative z-10">
                <span className="text-[9px] font-black text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md uppercase tracking-[0.15em] mb-3 inline-block">
                   {p.category_name}
                </span>
                <p className="font-bold text-white group-hover:text-accent transition-colors leading-snug min-h-[40px]">{p.name}</p>
                <div className="flex items-center gap-2 mt-2">
                   <div className={`w-1.5 h-1.5 rounded-full ${p.total_stock < p.min_stock ? 'bg-red-400' : 'bg-green-400'}`} />
                   <p className="text-[10px] font-black text-text-dim uppercase tracking-tighter">Stock: {p.total_stock}</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                <span className="text-2xl font-black text-white tracking-tighter italic">${p.price.toFixed(2)}</span>
                <div className="p-2 bg-white/10 rounded-xl group-hover:bg-accent group-hover:text-bg-dark transition-all group-hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                  <Plus size={18} strokeWidth={3} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="lg:w-96 flex flex-col glass-card border-white/10 shadow-2xl overflow-hidden shrink-0 relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0" />
        <div className="p-6 border-b border-white/10 bg-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg text-accent border border-accent/30">
              <ShoppingCart size={20} />
            </div>
            <span className="font-black text-white uppercase tracking-widest text-sm">Carrito</span>
          </div>
          <span className="bg-white/10 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">{cart.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <AnimatePresence>
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-6 opacity-30">
                   <ShoppingCart size={28} className="text-text-dim" />
                </div>
                <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] leading-relaxed">Carrito Vacío</p>
              </div>
            ) : (
              cart.map(item => (
                <motion.div 
                  key={item.product_id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{item.name}</p>
                    <p className="text-[10px] font-black text-accent uppercase mt-1">${item.unit_price.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
                      <button onClick={() => updateQuantity(item.product_id, -1)} className="w-6 h-6 flex items-center justify-center text-text-dim hover:text-white">
                         <Minus size={14} strokeWidth={3} />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, 1)} className="w-6 h-6 flex items-center justify-center text-text-dim hover:text-white">
                         <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.product_id)} 
                    className="p-1.5 text-text-dim hover:text-red-400 ml-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 bg-black/20 border-t border-white/10 space-y-6">
          <div className="grid grid-cols-2 p-1.5 bg-black/40 border border-white/10 rounded-2xl">
             <button 
               onClick={() => setDocType('boleta')}
               className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${docType === 'boleta' ? 'bg-white/15 text-white' : 'text-text-dim'}`}
             >Boleta</button>
             <button 
               onClick={() => setDocType('factura')}
               className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${docType === 'factura' ? 'bg-white/15 text-white' : 'text-text-dim'}`}
             >Factura</button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] font-black text-text-dim uppercase">Subtotal</span>
              <span className="text-xs font-black text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-5 border-t border-white/10 mt-2">
              <span className="text-xs font-black text-white uppercase">Total</span>
              <span className="text-3xl font-black text-accent tracking-tighter shadow-accent/20">
                 ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <button 
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
              cart.length === 0 || isProcessing 
              ? 'bg-text-dim/50 cursor-not-allowed text-bg-dark/50' 
              : 'bg-accent text-bg-dark hover:brightness-110'
            }`}
          >
            {isProcessing ? 'Procesando...' : (
              <>
                <CreditCard size={18} strokeWidth={3} />
                Validar y Cobrar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
