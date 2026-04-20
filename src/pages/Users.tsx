import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  UserPlus, 
  Shield, 
  Mail, 
  Trash2, 
  Edit2, 
  CheckCircle2,
  XCircle,
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'vendedor' | 'cajero';
  created_at: string;
}

export default function Users() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    role: 'vendedor' as const,
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ username: '', full_name: '', role: 'vendedor', password: '' });
        fetchUsers();
      }
    } catch (e) {
      console.error('Error saving user:', e);
    }
  };

  const deleteUser = async (id: number) => {
    if (id === currentUser?.id) {
      alert('No puedes eliminar tu propio usuario');
      return;
    }
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUsers();
    } catch (e) {
      console.error('Error deleting user:', e);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-accent/20 text-accent border-accent/30';
      case 'vendedor': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cajero': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Shield className="text-accent" />
            Usuarios y Roles
          </h1>
          <p className="text-text-dim mt-1">Gestiona los accesos y permisos de tu equipo</p>
        </div>
        
        <button 
          onClick={() => {
            setEditingUser(null);
            setFormData({ username: '', full_name: '', role: 'vendedor', password: '' });
            setShowModal(true);
          }}
          className="bg-accent text-bg-dark px-6 py-3 rounded-2xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-accent/20"
        >
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className="glass p-6 rounded-3xl border border-white/5 flex flex-col gap-4 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${getRoleColor(u.role).split(' ')[1].replace('text-', 'bg-')}`} />
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl border ${getRoleColor(u.role)}`}>
                  {u.full_name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-white">{u.full_name}</h3>
                  <p className="text-xs text-text-dim flex items-center gap-1">
                    <UserIcon size={10} />
                    @{u.username}
                  </p>
                </div>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getRoleColor(u.role)}`}>
                {u.role}
              </div>
            </div>

            <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
              <p className="text-[10px] text-text-dim italic">
                Miembro desde {new Date(u.created_at).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setEditingUser(u);
                    setFormData({ username: u.username, full_name: u.full_name, role: u.role, password: '' });
                    setShowModal(true);
                  }}
                  className="p-2 text-text-dim hover:text-white transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => deleteUser(u.id)}
                  className="p-2 text-text-dim hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bg-dark/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="glass w-full max-w-md p-8 rounded-[2rem] border-white/10 relative animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-dim uppercase ml-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-accent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-dim uppercase ml-1">Usuario (Username)</label>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-accent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-dim uppercase ml-1">Rol / Permisos</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-accent transition-all appearance-none"
                >
                  <option value="admin" className="bg-bg-dark">Administrador / Gerente</option>
                  <option value="vendedor" className="bg-bg-dark">Vendedor / Preventista</option>
                  <option value="cajero" className="bg-bg-dark">Cajero / Facturación</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-dim uppercase ml-1">
                  {editingUser ? 'Cambiar Contraseña (opcional)' : 'Contraseña'}
                </label>
                <input 
                  type="password" 
                  required={!editingUser}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-accent transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 text-xs font-bold text-text-dim uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-accent text-bg-dark py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-accent/20"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
