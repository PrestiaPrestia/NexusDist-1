import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Plus, 
  Download,
  Wallet
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

interface CashFlowItem {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  currency_code: string;
  description: string;
  full_name: string;
  created_at: string;
}

export default function Financial() {
  const { token } = useAuth();
  const [flow, setFlow] = useState<CashFlowItem[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    currency_code: 'USD'
  });

  const fetchData = () => {
    fetch('/api/cashflow', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setFlow(data);
        const inc = data.filter((i: any) => i.type === 'income').reduce((acc: number, i: any) => acc + i.amount, 0);
        const exp = data.filter((i: any) => i.type === 'expense').reduce((acc: number, i: any) => acc + i.amount, 0);
        setTotalIncome(inc);
        setTotalExpenses(exp);
      }
    })
    .catch(err => console.error('Error fetching cashflow:', err));
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/cashflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ type: 'expense', amount: '', description: '', currency_code: 'USD' });
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Error al guardar operación');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Análisis Financiero</h1>
          <p className="text-text-dim font-medium">Control de ingresos y egresos diarios de la distribuidora.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-accent text-bg-dark px-5 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          Nueva Operación
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-6 border-white/10 group overflow-hidden relative">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
             <TrendingUp size={64} className="text-green-400" />
           </div>
           <div className="flex items-center gap-3 mb-6 relative z-10">
             <div className="p-2.5 bg-green-400/20 text-green-400 rounded-xl border border-green-400/20">
               <ArrowUpRight size={20} />
             </div>
             <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Ingresos Totales</p>
           </div>
           <h3 className="text-3xl font-black text-white relative z-10">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
        
        <div className="glass-card p-6 border-white/10 group overflow-hidden relative">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform rotate-90">
             <TrendingUp size={64} className="text-red-400" />
           </div>
           <div className="flex items-center gap-3 mb-6 relative z-10">
             <div className="p-2.5 bg-red-400/20 text-red-400 rounded-xl border border-red-400/20">
               <ArrowDownRight size={20} />
             </div>
             <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Egresos Totales</p>
           </div>
           <h3 className="text-3xl font-black text-white relative z-10">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className="bg-accent p-6 rounded-2xl shadow-xl shadow-accent/20 text-bg-dark group overflow-hidden relative">
           <div className="absolute -top-4 -right-4 p-4 opacity-10 scale-150 rotate-12 transition-transform">
             <Wallet size={80} />
           </div>
           <div className="flex items-center gap-3 mb-6 relative z-10">
             <div className="p-2.5 bg-bg-dark/10 rounded-xl">
               <Wallet size={20} />
             </div>
             <p className="text-[10px] font-black text-bg-dark/60 uppercase tracking-widest">Saldo en Caja</p>
           </div>
           <div className="flex items-baseline gap-2 relative z-10">
             <h3 className="text-3xl font-black">${(totalIncome - totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
             <span className="text-xs font-black opacity-60">USD</span>
           </div>
        </div>
      </div>

      <div className="glass-card border-white/10 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
           <h3 className="font-bold text-white uppercase tracking-tight">Movimientos de Caja</h3>
           <button className="text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-accent/10 px-4 py-2 rounded-lg transition-all">
             <Download size={14} strokeWidth={3} />
             Exportar Libro
           </button>
        </div>
        <div className="divide-y divide-white/5">
          {flow.map(item => (
            <div key={item.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-6">
                <div className={`p-3 rounded-2xl border transition-all ${item.type === 'income' ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
                  {item.type === 'income' ? <ArrowUpRight size={20} strokeWidth={3} /> : <ArrowDownRight size={20} strokeWidth={3} />}
                </div>
                <div>
                  <p className="font-bold text-white text-base leading-tight group-hover:text-accent transition-colors">{item.description}</p>
                  <p className="text-[11px] font-bold text-text-dim uppercase tracking-tighter mt-1 opacity-60">
                    {format(new Date(item.created_at), 'dd MMM, HH:mm')} • Registrado por {item.full_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-black tracking-tighter ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                </p>
                <p className="text-[9px] text-text-dim font-black uppercase tracking-[0.2em] mt-0.5">{item.currency_code}</p>
              </div>
            </div>
          ))}
          {flow.length === 0 && (
            <div className="py-24 text-center">
              <Wallet className="mx-auto text-text-dim opacity-10 mb-6" size={80} />
              <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em]">Caja sin movimientos</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nueva Operación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-8 border-white/10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Nueva Operación</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-text-dim hover:text-white">
                  <Plus size={24} className="rotate-45" />
                </button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex p-1 bg-black/40 rounded-xl gap-1">
                   <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'income'})}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'income' ? 'bg-green-500 text-bg-dark' : 'text-text-dim hover:text-white'}`}
                   >
                     Ingreso
                   </button>
                   <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'expense'})}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'expense' ? 'bg-red-500 text-bg-dark' : 'text-text-dim hover:text-white'}`}
                   >
                     Egreso
                   </button>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Monto (USD)</label>
                   <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={18} />
                      <input 
                        required
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-1 focus:ring-accent"
                        placeholder="0.00"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Descripción</label>
                   <textarea 
                    required
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-1 focus:ring-accent min-h-[100px]"
                    placeholder="Ej. Pago a proveedor, Venta menor, etc."
                   />
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-accent text-bg-dark rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Registrando...' : 'Registrar Operación'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
