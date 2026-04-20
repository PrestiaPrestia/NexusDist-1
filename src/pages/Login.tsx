import React, { useState } from 'react';
import { useAuth } from '../App';
import { Building, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

      login(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-bg-dark">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/15 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 12 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-accent text-bg-dark rounded-[2.5rem] mb-6 shadow-[0_0_50px_rgba(56,189,248,0.3)] border-4 border-white/20"
          >
            <Building size={48} strokeWidth={2.5} />
          </motion.div>
          <h2 className="text-5xl font-black text-white tracking-tighter mb-2">NexusDist</h2>
          <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.4em] opacity-60">Sistemas de Distribución Inteligente</p>
        </div>

        <div className="glass-card p-10 border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0" />
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Autenticación de Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-dim">
                  <UserIcon size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white font-medium outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-text-dim/20 shadow-inner"
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Clave de Acceso</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-dim">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white font-medium outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-text-dim/20 shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black rounded-xl text-center uppercase tracking-widest"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-bg-dark py-5 px-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-accent/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 border border-white/20"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} strokeWidth={3} /> : 'Iniciar Sesión'}
            </button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-[9px] font-black text-text-dim/40 uppercase tracking-[0.2em] leading-relaxed">
              © 2026 NexusDist ERP v2.0<br/>Secure Enterprise Environment
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
