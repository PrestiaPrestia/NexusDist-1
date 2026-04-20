import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Client } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  MoreHorizontal,
  History
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Clients() {
  const { token } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // In a real app we'd fetch from /api/clients
    // For this demo let's mock some data if none exist or just use static for now
    setClients([
      { id: 1, document_id: '20123456789', name: 'Corporación Alimentos SAC', email: 'contacto@coralimentos.com', phone: '987 654 321' },
      { id: 2, document_id: '10443322110', name: 'Juan Perez Tienda Local', email: 'juan.tienda@gmail.com', phone: '912 345 678' }
    ]);
  }, [token]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Directorio de Clientes</h1>
          <p className="text-text-dim font-medium">Gestiona tus relaciones comerciales y carteras.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-accent text-bg-dark px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]">
          <Plus size={18} strokeWidth={3} />
          Nuevo Cliente
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por RUC/DNI o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-black/30 border border-white/10 rounded-2xl focus:ring-1 focus:ring-accent outline-none text-sm text-white placeholder:text-text-dim/40 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clients.map(client => (
          <motion.div 
            key={client.id}
            whileHover={{ y: -6, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            className="glass-card p-6 border-white/10 flex flex-col justify-between group transition-all"
          >
            <div>
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/20 text-accent flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.1)]">
                  <Users size={28} />
                </div>
                <button className="p-2 text-text-dim hover:text-white transition-all opacity-40 hover:opacity-100">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight leading-tight mb-1">{client.name}</h3>
              <p className="text-[10px] font-black text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-md uppercase tracking-[0.2em] mb-6 inline-block">
                ID: {client.document_id}
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-text-dim group-hover:text-white/80 transition-colors">
                  <Mail size={16} className="text-accent" />
                  <span className="font-medium">{client.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-dim group-hover:text-white/80 transition-colors">
                  <Phone size={16} className="text-accent" />
                  <span className="font-medium">{client.phone}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-white/5 mt-4">
              <button className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-white bg-white/5 border border-white/10 rounded-xl transition-all hover:bg-white/10">
                <History size={14} />
                Historial
              </button>
              <button className="inline-flex items-center justify-center p-2.5 text-accent bg-accent/10 border border-accent/20 rounded-xl hover:bg-accent hover:text-bg-dark transition-all">
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
