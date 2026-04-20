import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Stats } from '../types';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <motion.div 
    whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
    className="glass-card p-6 border-white/10"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-bold text-text-dim uppercase tracking-wider mb-2">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{Math.abs(trend)}% vs ayer</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent`}>
        <Icon size={24} />
      </div>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setStats);
  }, [token]);

  if (!stats) return <div className="text-text-dim animate-pulse">Cargando dashboard...</div>;

  return (
    <div className="space-y-10 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Panel Administrativo</h1>
          <p className="text-text-dim font-medium">Distribuidora Central • Sede Principal</p>
        </div>
        <div className="hidden md:flex gap-4 text-xs font-bold bg-black/30 px-4 py-2 rounded-full border border-white/10">
           <span className="text-text-dim">Actualización: <span className="text-accent">Reciente</span></span>
           <span className="text-text-dim">USD: <span className="text-white">3.75</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ventas Totales" 
          value={`$${stats.total_sales.toLocaleString()}`} 
          icon={DollarSign} 
        />
        <StatCard 
          title="Pedidos Hoy" 
          value={stats.product_count} 
          icon={Package} 
        />
        <StatCard 
          title="Stock Crítico" 
          value={stats.low_stock.length} 
          icon={AlertTriangle} 
          trend={-2}
        />
        <StatCard 
          title="Crecimiento" 
          value="24.8%" 
          icon={TrendingUp} 
          trend={5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Chart */}
        <div className="glass-card p-8 border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">Rendimiento Semanal</h3>
            <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-extrabold rounded-md border border-accent/20 uppercase tracking-widest">Octubre 2026</span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.sales_history}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#38bdf8" 
                  strokeWidth={3}
                  shadow="0 0 20px rgba(56, 189, 248, 0.3)"
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card p-8 border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Estado de Inventario</h3>
            <span className="flex items-center gap-2 text-[11px] font-bold text-text-dim">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
Sincronizado
            </span>
          </div>
          <div className="space-y-4">
            {stats.low_stock.length > 0 ? (
              stats.low_stock.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-red-400 rounded-full" />
                    <p className="font-bold text-gray-100">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-red-400">{item.stock} UN</p>
                    <p className="text-[10px] font-bold text-text-dim uppercase tracking-tighter">Stock Crítico</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 opacity-50">
                <Package className="mx-auto text-text-dim mb-4" size={48} />
                <p className="text-text-dim font-bold uppercase text-xs tracking-widest">Sin alertas críticas</p>
              </div>
            )}
          </div>
          <p className="mt-8 text-center text-xs font-bold text-accent uppercase hover:tracking-widest transition-all cursor-pointer">Revisar Almacén Completo</p>
        </div>
      </div>
    </div>
  );
}
