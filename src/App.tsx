import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  History, 
  TrendingUp, 
  LogOut, 
  Settings,
  Menu,
  X,
  CreditCard,
  Building,
  Smartphone,
  Shield
} from 'lucide-react';
import { User } from './types';

// Auth State
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Components (Stubs for now to get App.tsx running)
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Clients from './pages/Clients';
import Login from './pages/Login';
import MobileSeller from './pages/MobileSeller';
import HistoryPage from './pages/History'; // Avoid 'History' name conflict
import Financial from './pages/Financial';
import UsersPage from './pages/Users';
import SettingsPage from './pages/Settings';

const SidebarLink = ({ to, icon: Icon, children, onClick }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
        isActive 
          ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]' 
          : 'text-text-dim hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={18} className={isActive ? 'text-accent' : ''} />
      <span className="font-medium text-sm">{children}</span>
    </Link>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-52 glass border-r-0 z-50 shrink-0">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-1.5 bg-accent/20 rounded-lg text-accent border border-accent/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <Building size={20} />
            </div>
            <h1 className="text-lg font-extrabold tracking-tight text-accent uppercase">NexusDist</h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-4">
          <SidebarLink to="/" icon={LayoutDashboard}>Panel Principal</SidebarLink>
          <SidebarLink to="/inventory" icon={Package}>Inventario</SidebarLink>
          <SidebarLink to="/sales" icon={ShoppingCart}>Nueva Venta</SidebarLink>
          <SidebarLink to="/clients" icon={Users}>Clientes</SidebarLink>
          <SidebarLink to="/history" icon={History}>Historial</SidebarLink>
          <SidebarLink to="/reports" icon={TrendingUp}>Caja y Reportes</SidebarLink>
          <SidebarLink to="/mobile" icon={Smartphone}>Venta Móvil</SidebarLink>
          <div className="pt-4 mt-4 border-t border-white/5">
            <SidebarLink to="/settings" icon={Settings}>Ajustes del Sistema</SidebarLink>
          </div>
        </nav>

        <div className="mt-auto p-4 border-t border-glass-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold">
              {user?.full_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-text-dim uppercase tracking-wider font-bold">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 glass border-x-0 border-t-0 sticky top-0 z-40">
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-text-dim">
             <Menu size={24} />
           </button>
           <h1 className="text-lg font-bold text-accent">NexusDist</h1>
           <div className="w-10" />
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
           {children}
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <>
            <div 
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            />
            <div 
              className="fixed top-0 left-0 bottom-0 w-3/4 max-w-sm bg-bg-dark z-50 lg:hidden p-6 border-r border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-xl font-bold text-accent">NexusDist</h1>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white">
                  <X size={24} />
                </button>
              </div>
              <nav className="space-y-1" onClick={() => setIsMobileMenuOpen(false)}>
                <SidebarLink to="/" icon={LayoutDashboard}>Panel Principal</SidebarLink>
                <SidebarLink to="/inventory" icon={Package}>Inventario</SidebarLink>
                <SidebarLink to="/sales" icon={ShoppingCart}>Nueva Venta</SidebarLink>
                <SidebarLink to="/clients" icon={Users}>Clientes</SidebarLink>
                <SidebarLink to="/settings" icon={Settings}>Ajustes del Sistema</SidebarLink>
                <SidebarLink to="/mobile" icon={Smartphone}>Venta Móvil</SidebarLink>
              </nav>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('nexus_token');
    const savedUser = localStorage.getItem('nexus_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, newToken: string) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('nexus_token', newToken);
    localStorage.setItem('nexus_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <Router>
        <Routes>
          {!token ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <Route path="/" element={<Layout><Dashboard /></Layout>}>
              {/* Children would be here but we use top level for simple stubs */}
            </Route>
          )}
          
          {token && (
            <>
              <Route path="/" element={<Layout><Dashboard /></Layout>} />
              <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
              <Route path="/sales" element={<Layout><Sales /></Layout>} />
              <Route path="/clients" element={<Layout><Clients /></Layout>} />
              <Route path="/history" element={<Layout><HistoryPage /></Layout>} />
              <Route path="/reports" element={<Layout><Financial /></Layout>} />
              <Route path="/users" element={<Layout><UsersPage /></Layout>} />
              <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
              <Route path="/mobile" element={<Layout><MobileSeller /></Layout>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}
