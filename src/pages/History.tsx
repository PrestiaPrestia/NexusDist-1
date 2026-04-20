import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  History as HistoryIcon, 
  Search, 
  FileText, 
  Download,
  Eye,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

interface SaleRecord {
  id: number;
  doc_type: string;
  doc_number: string;
  total: number;
  currency_code: string;
  created_at: string;
  full_name: string;
}

export default function History() {
  const { token } = useAuth();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // In a real app we'd have a specific /api/sales/history endpoint
    // We'll reuse the stats structure or a new list if we had the endpoint.
    // Let's mock the list since we only implemented stats/product list so far.
    // Actually, I can add an endpoint to server.ts quickly.
    
    fetch('/api/sales/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setSales)
    .catch(() => {
      // Fallback if endpoint doesn't exist yet
      setSales([]);
    });
  }, [token]);

  const filteredSales = sales.filter(s => 
    s.doc_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Registro de Ventas</h1>
          <p className="text-text-dim font-medium">Auditoría completa de transacciones y comprobantes.</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 glass-card hover:bg-white/10 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-white transition-all border-white/10">
             <Calendar size={16} />
             Periodo
           </button>
           <button className="flex items-center gap-2 bg-accent text-bg-dark px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all">
             <Download size={16} strokeWidth={3} />
             Exportar CSV
           </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden border-white/10 shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/5">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
            <input 
              type="text" 
              placeholder="Filtro rápido por cliente o #doc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-2xl focus:ring-1 focus:ring-accent outline-none text-sm text-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/2 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-text-dim uppercase tracking-widest">Emisión</th>
                <th className="px-8 py-5 text-[10px] font-black text-text-dim uppercase tracking-widest">Documento</th>
                <th className="px-8 py-5 text-[10px] font-black text-text-dim uppercase tracking-widest">Responsable</th>
                <th className="px-8 py-5 text-[10px] font-black text-text-dim uppercase tracking-widest">Importe</th>
                <th className="px-8 py-5 text-[10px] font-black text-text-dim uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5 text-xs font-bold text-text-dim">
                    {format(new Date(sale.created_at), 'dd/MM/yy • HH:mm')}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">{sale.doc_number}</span>
                      <span className="text-[9px] text-accent font-black uppercase tracking-widest mt-0.5">{sale.doc_type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-text-dim">{sale.full_name}</td>
                  <td className="px-8 py-5">
                     <span className="font-black text-white text-sm">
                        {sale.currency_code} {sale.total.toFixed(2)}
                     </span>
                  </td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button className="p-2.5 text-text-dim hover:text-accent transition-all opacity-40 hover:opacity-100">
                      <Eye size={18} />
                    </button>
                    <button className="p-2.5 text-text-dim hover:text-white transition-all opacity-40 hover:opacity-100">
                      <FileText size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <HistoryIcon className="mx-auto text-text-dim opacity-10 mb-6" size={80} />
                    <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em]">Sin registros históricos</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
