import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { Product, Client } from '../types';
import {
  Smartphone, MapPin, ShoppingCart, Search, Plus, Minus,
  CheckCircle2, Package, History, Users, TrendingUp,
  WifiOff, Wifi, UserPlus, ChevronLeft, Trash2, Send,
  ClipboardList, AlertCircle, X, RefreshCw
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartItem { product_id: number; name: string; quantity: number; unit_price: number; }
interface OfflineOrder { id: string; items: CartItem[]; client_id: number; client_name: string; total: number; created_at: string; synced: boolean; }
interface SaleRecord { id: number; doc_number: string; total: number; created_at: string; client_name?: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const OFFLINE_KEY = 'nexus_offline_orders';
const loadOfflineOrders = (): OfflineOrder[] => { try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]'); } catch { return []; } };
const saveOfflineOrders = (orders: OfflineOrder[]) => localStorage.setItem(OFFLINE_KEY, JSON.stringify(orders));

// ─── Sub-components ───────────────────────────────────────────────────────────
function NavTab({ icon: Icon, label, active, badge, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-2 transition-all ${active ? 'text-accent' : 'text-white/30'}`}>
      <div className="relative">
        <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
        {badge > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-bg-dark text-[8px] font-black rounded-full flex items-center justify-center">{badge}</span>}
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
    </button>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MobileSeller() {
  const { token, user } = useAuth();

  // Navigation
  const [tab, setTab] = useState<'pos' | 'history' | 'clients' | 'stats'>('pos');

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // POS state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchProduct, setSearchProduct] = useState('');
  const [isCheckout, setIsCheckout] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Location
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Offline orders
  const [offlineOrders, setOfflineOrders] = useState<OfflineOrder[]>(loadOfflineOrders());

  // Client registration
  const [showRegisterClient, setShowRegisterClient] = useState(false);
  const [newClient, setNewClient] = useState({ document_id: '', name: '', phone: '', email: '' });
  const [registerLoading, setRegisterLoading] = useState(false);

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(p => setLocation({ lat: p.coords.latitude, lon: p.coords.longitude }));
    }
    const handleOnline = () => { setIsOnline(true); syncOfflineOrders(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [pRes, cRes, sRes] = await Promise.all([
        fetch('/api/products', { headers }),
        fetch('/api/clients', { headers }),
        fetch('/api/sales/history', { headers }),
      ]);
      
      let pData = [], cData = [], sData = [];
      if (pRes.ok) pData = await pRes.json();
      if (cRes.ok) cData = await cRes.json();
      if (sRes.ok) sData = await sRes.json();

      setProducts(Array.isArray(pData) ? pData : []);
      setClients(Array.isArray(cData) ? cData : []);
      setSales(Array.isArray(sData) ? sData.slice(0, 20) : []);
    } catch (e) { 
      console.error('Fetch error:', e);
    }
    finally { setLoading(false); }
  };

  // ─── Offline Sync ─────────────────────────────────────────────────────────
  const syncOfflineOrders = useCallback(async () => {
    const pending = loadOfflineOrders().filter(o => !o.synced);
    if (pending.length === 0) return;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const updated = loadOfflineOrders();
    for (const order of pending) {
      try {
        const res = await fetch('/api/sales', { method: 'POST', headers, body: JSON.stringify({ items: order.items, doc_type: 'boleta', currency_code: 'USD', exchange_rate: 1.0, client_id: order.client_id }) });
        if (res.ok) { const idx = updated.findIndex(o => o.id === order.id); if (idx > -1) updated[idx].synced = true; }
      } catch {}
    }
    saveOfflineOrders(updated);
    setOfflineOrders(updated);
  }, [token]);

  // ─── POS Logic ────────────────────────────────────────────────────────────
  const addToCart = (p: Product) => {
    setCart(prev => {
      const ex = prev.find(i => i.product_id === p.id);
      if (ex) return prev.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product_id: p.id, name: p.name, quantity: 1, unit_price: p.price }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => i.product_id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const total = cart.reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const tax   = total * 0.18;

  const handleOrder = async () => {
    if (!selectedClient || cart.length === 0) return;
    setIsOrdering(true);
    const body = { items: cart, doc_type: 'boleta', currency_code: 'USD', exchange_rate: 1.0, client_id: selectedClient.id };

    if (!isOnline) {
      // Save offline
      const offlineEntry: OfflineOrder = { id: `offline-${Date.now()}`, items: cart, client_id: selectedClient.id, client_name: selectedClient.name, total: total + tax, created_at: new Date().toISOString(), synced: false };
      const updated = [...offlineOrders, offlineEntry];
      saveOfflineOrders(updated);
      setOfflineOrders(updated);
      setCart([]); setIsCheckout(false); setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 3000);
      setIsOrdering(false);
      return;
    }

    try {
      const res = await fetch('/api/sales', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setCart([]); setIsCheckout(false); setOrderSuccess(true);
        setTimeout(() => setOrderSuccess(false), 3000);
        fetchData();
      } else { const d = await res.json(); alert('Error: ' + (d.error || 'Desconocido')); }
    } catch { alert('Error de conexión'); }
    finally { setIsOrdering(false); }
  };

  // ─── Client Registration ──────────────────────────────────────────────────
  const handleRegisterClient = async () => {
    if (!newClient.document_id || !newClient.name) return;
    setRegisterLoading(true);
    try {
      const res = await fetch('/api/clients', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newClient, address: location ? `GPS: ${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}` : '' }) });
      if (res.ok) {
        setNewClient({ document_id: '', name: '', phone: '', email: '' });
        setShowRegisterClient(false);
        fetchData();
      } else { const d = await res.json(); alert('Error: ' + (d.error || 'Desconocido')); }
    } catch { alert('Error de conexión'); }
    finally { setRegisterLoading(false); }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.code.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const pendingOffline = offlineOrders.filter(o => !o.synced).length;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="flex items-start justify-center min-h-[calc(100vh-120px)] py-4">
      {/* Phone Frame */}
      <div className="w-[390px] bg-[#0a0a0f] rounded-[3rem] border-2 border-white/10 shadow-[0_0_80px_rgba(56,189,248,0.08),inset_0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col" style={{ height: '780px' }}>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-8 pt-4 pb-2 shrink-0">
          <span className="text-[10px] font-bold text-white/50">{new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="w-24 h-5 bg-black rounded-full border border-white/10" />
          <div className="flex items-center gap-1.5">
            {isOnline ? <Wifi size={12} className="text-green-400" /> : <WifiOff size={12} className="text-red-400" />}
            {pendingOffline > 0 && <span className="text-[9px] text-yellow-400 font-bold">{pendingOffline} pend.</span>}
          </div>
        </div>

        {/* App Header */}
        <div className="px-6 py-3 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">NexusDist Móvil</p>
            <h2 className="text-lg font-black text-white">Hola, {(user?.full_name || 'Vendedor').split(' ')[0]} 👋</h2>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] bg-black/50 border border-white/10 px-3 py-1.5 rounded-full text-white/60 font-bold">
            <MapPin size={9} className="text-accent" />
            {location ? `${location.lat.toFixed(3)}°` : 'GPS...'}
          </div>
        </div>

        {/* Success Banner */}
        {orderSuccess && (
          <div className="mx-6 mb-3 p-3 bg-green-500/15 border border-green-500/25 rounded-2xl flex items-center gap-3 text-green-400 text-xs font-bold shrink-0">
            <CheckCircle2 size={16} />
            {isOnline ? '¡Pedido enviado a central!' : '¡Guardado sin conexión — se sincronizará al reconectar!'}
          </div>
        )}

        {/* Offline banner */}
        {!isOnline && (
          <div className="mx-6 mb-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-2 text-yellow-400 text-[10px] font-bold shrink-0">
            <WifiOff size={14} /> Sin conexión — los pedidos se guardarán localmente
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* ── TAB: POS ── */}
          {tab === 'pos' && !isCheckout && (
            <div className="px-4 pb-4 space-y-4">
              {/* Stats mini */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                <div className="min-w-[120px] bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <p className="text-[8px] text-white/40 uppercase font-bold">En carrito</p>
                  <p className="text-xl font-black text-accent">{cart.length}</p>
                </div>
                <div className="min-w-[120px] bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <p className="text-[8px] text-white/40 uppercase font-bold">Total</p>
                  <p className="text-xl font-black text-white">${total.toFixed(0)}</p>
                </div>
                <div className="min-w-[120px] bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <p className="text-[8px] text-white/40 uppercase font-bold">Pedidos hoy</p>
                  <p className="text-xl font-black text-green-400">{sales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length}</p>
                </div>
              </div>

              {/* Client selector */}
              <div>
                <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-2">Cliente</p>
                {selectedClient ? (
                  <div className="flex items-center justify-between p-3 bg-accent/10 border border-accent/30 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-black text-sm">{(selectedClient?.name || '?')[0]}</div>
                      <div>
                        <p className="text-xs font-bold text-white">{selectedClient.name}</p>
                        <p className="text-[9px] text-white/40">{selectedClient.document_id}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedClient(null)} className="text-white/30 hover:text-white"><X size={14} /></button>
                  </div>
                ) : (
                  <select
                    onChange={e => { const c = clients.find(c => c.id === +e.target.value); setSelectedClient(c || null); }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-accent/40"
                    defaultValue=""
                  >
                    <option value="" disabled className="bg-bg-dark">— Seleccionar cliente —</option>
                    {clients.map(c => <option key={c.id} value={c.id} className="bg-bg-dark">{c.name}</option>)}
                  </select>
                )}
              </div>

              {/* Product Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                <input type="text" placeholder="Buscar producto o SKU..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-black/30 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/30" />
              </div>

              {/* Product List */}
              {loading ? (
                <div className="text-center py-10 text-white/20 text-xs">Cargando productos...</div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map(p => {
                    const inCart = cart.find(i => i.product_id === p.id);
                    return (
                      <div key={p.id} className={`flex items-center gap-3 p-3 border rounded-2xl transition-all ${inCart ? 'bg-accent/10 border-accent/30' : 'bg-white/3 border-white/10'}`}>
                        <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center text-white/20 shrink-0">
                          <Package size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-black text-accent">${p.price}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${p.total_stock > 10 ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
                              {p.total_stock} uds
                            </span>
                          </div>
                        </div>
                        {inCart ? (
                          <div className="flex items-center gap-1 bg-black/30 rounded-xl p-1">
                            <button onClick={() => updateQty(p.id, -1)} className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white"><Minus size={12} /></button>
                            <span className="w-5 text-center text-xs font-black text-accent">{inCart.quantity}</span>
                            <button onClick={() => updateQty(p.id, 1)} className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white"><Plus size={12} /></button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(p)} className="w-9 h-9 rounded-xl bg-accent text-bg-dark flex items-center justify-center shadow-lg shadow-accent/20 active:scale-90 transition-all">
                            <Plus size={16} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── CHECKOUT VIEW ── */}
          {tab === 'pos' && isCheckout && (
            <div className="px-4 pb-4 space-y-4">
              <button onClick={() => setIsCheckout(false)} className="flex items-center gap-2 text-xs text-white/50 font-bold py-2">
                <ChevronLeft size={14} /> Volver al catálogo
              </button>
              <h3 className="text-base font-black text-white">Resumen del Pedido</h3>

              {/* Client info */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-[9px] text-white/40 uppercase font-bold mb-1">Cliente</p>
                <p className="text-sm font-bold text-white">{selectedClient?.name || 'No seleccionado'}</p>
                <p className="text-[10px] text-white/40">{selectedClient?.document_id}</p>
              </div>

              {/* Cart items */}
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.product_id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-white/40">${item.unit_price} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-accent">${(item.unit_price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => updateQty(item.product_id, -item.quantity)} className="text-red-400/50 hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs text-white/50"><span>Subtotal</span><span className="font-bold text-white">${total.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs text-white/50"><span>IGV (18%)</span><span className="font-bold text-white">${tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm font-black border-t border-white/10 pt-2"><span className="text-white">TOTAL</span><span className="text-accent">${(total + tax).toFixed(2)}</span></div>
              </div>

              {/* Send button */}
              <button onClick={handleOrder} disabled={isOrdering || !selectedClient}
                className="w-full py-4 bg-accent text-bg-dark font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50 active:scale-95 transition-all">
                {isOrdering ? <><RefreshCw size={16} className="animate-spin" /> Enviando...</> : <><Send size={16} /> {isOnline ? 'Enviar Pedido' : 'Guardar sin Conexión'}</>}
              </button>
            </div>
          )}

          {/* ── TAB: HISTORY ── */}
          {tab === 'history' && (
            <div className="px-4 pb-4 space-y-4">
              <h3 className="text-base font-black text-white pt-2">Historial de Pedidos</h3>

              {/* Offline pending */}
              {offlineOrders.filter(o => !o.synced).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] text-yellow-400 uppercase font-black tracking-widest">Pendiente de sincronización</p>
                  {offlineOrders.filter(o => !o.synced).map(o => (
                    <div key={o.id} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{o.client_name}</p>
                        <p className="text-[9px] text-yellow-400/70">{new Date(o.created_at).toLocaleString('es')} — {o.items.length} items</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <WifiOff size={12} className="text-yellow-400" />
                        <span className="text-xs font-black text-yellow-400">${o.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  {isOnline && (
                    <button onClick={syncOfflineOrders} className="w-full py-2.5 border border-accent/30 text-accent text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                      <RefreshCw size={12} /> Sincronizar ahora
                    </button>
                  )}
                </div>
              )}

              {/* Server sales */}
              <p className="text-[9px] text-white/40 uppercase font-black tracking-widest">Últimas ventas</p>
              {sales.length === 0 ? (
                <div className="py-10 text-center text-white/20">
                  <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-bold">Sin registros</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sales.map(s => (
                    <div key={s.id} className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{s.doc_number}</p>
                        <p className="text-[9px] text-white/40">{new Date(s.created_at).toLocaleString('es')}</p>
                      </div>
                      <span className="text-sm font-black text-accent">${Number(s.total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: CLIENTS ── */}
          {tab === 'clients' && (
            <div className="px-4 pb-4 space-y-4">
              <div className="flex items-center justify-between pt-2">
                <h3 className="text-base font-black text-white">Clientes</h3>
                <button onClick={() => setShowRegisterClient(!showRegisterClient)}
                  className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-2 rounded-xl transition-all ${showRegisterClient ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>
                  {showRegisterClient ? <><X size={12} /> Cancelar</> : <><UserPlus size={12} /> Nuevo</>}
                </button>
              </div>

              {/* Register form */}
              {showRegisterClient && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <p className="text-[9px] text-accent uppercase font-black tracking-widest">Registrar nuevo cliente</p>
                  {location && <p className="text-[9px] text-white/30 flex items-center gap-1"><MapPin size={9} className="text-accent" />GPS capturado: {location.lat?.toFixed(4)}, {location.lon?.toFixed(4)}</p>}
                  <input placeholder="RUC / Cédula *" value={newClient.document_id} onChange={e => setNewClient(p => ({...p, document_id: e.target.value}))}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-accent/40" />
                  <input placeholder="Nombre o Razón Social *" value={newClient.name} onChange={e => setNewClient(p => ({...p, name: e.target.value}))}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-accent/40" />
                  <input placeholder="Teléfono" value={newClient.phone} onChange={e => setNewClient(p => ({...p, phone: e.target.value}))}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-accent/40" />
                  <input placeholder="Email" value={newClient.email} onChange={e => setNewClient(p => ({...p, email: e.target.value}))}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-accent/40" />
                  <button onClick={handleRegisterClient} disabled={registerLoading || !newClient.document_id || !newClient.name}
                    className="w-full py-3 bg-accent text-bg-dark font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
                    {registerLoading ? <><RefreshCw size={12} className="animate-spin" /> Guardando...</> : <><CheckCircle2 size={12} /> Registrar Cliente</>}
                  </button>
                </div>
              )}

              {/* Client list */}
              <div className="space-y-2">
                {clients.map(c => (
                  <button key={c.id} onClick={() => { setSelectedClient(c); setTab('pos'); }}
                    className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-accent/30 transition-all">
                    <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent font-black text-sm shrink-0">{(c?.name || '?')[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{c.name}</p>
                      <p className="text-[9px] text-white/40">{c.document_id} {c.phone ? `• ${c.phone}` : ''}</p>
                    </div>
                    <Plus size={14} className="text-white/20 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: STATS ── */}
          {tab === 'stats' && (
            <div className="px-4 pb-4 space-y-4">
              <h3 className="text-base font-black text-white pt-2">Mi Rendimiento</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-[8px] text-white/40 uppercase font-bold">Ventas Totales</p>
                  <p className="text-2xl font-black text-white">{sales.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-[8px] text-white/40 uppercase font-bold">Ingresos</p>
                  <p className="text-2xl font-black text-accent">${sales.reduce((a, s) => a + Number(s.total), 0).toFixed(0)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-[8px] text-white/40 uppercase font-bold">Clientes</p>
                  <p className="text-2xl font-black text-blue-400">{clients.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-[8px] text-white/40 uppercase font-bold">Sin Sync</p>
                  <p className={`text-2xl font-black ${pendingOffline > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{pendingOffline}</p>
                </div>
              </div>

              {/* Offline sync summary */}
              {pendingOffline > 0 && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={16} className="text-yellow-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-yellow-400">{pendingOffline} pedido(s) sin sincronizar</p>
                    <p className="text-[9px] text-yellow-400/60 mt-1">Se enviarán automáticamente al recuperar la conexión.</p>
                  </div>
                </div>
              )}

              {/* Route progress */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <p className="text-[9px] text-white/40 uppercase font-black">Progreso de ruta</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Visitas realizadas</span>
                  <span className="font-bold text-white">{Math.min(sales.length, 8)} / 12</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min((sales.length / 12) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Checkout CTA (POS tab only, not in checkout view) */}
        {tab === 'pos' && !isCheckout && cart.length > 0 && (
          <div className="px-4 py-3 bg-black/40 border-t border-white/10 shrink-0">
            <button onClick={() => { if (!selectedClient) { alert('Selecciona un cliente primero'); return; } setIsCheckout(true); }}
              className="w-full py-3.5 bg-accent text-bg-dark font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-95 transition-all">
              <ShoppingCart size={16} strokeWidth={2.5} />
              Revisar Pedido ({cart.length} items • ${total.toFixed(2)})
            </button>
          </div>
        )}

        {/* Bottom Nav */}
        <div className="grid grid-cols-4 px-2 py-3 bg-black/60 border-t border-white/10 shrink-0">
          <NavTab icon={ShoppingCart} label="POS" active={tab === 'pos'} badge={cart.length} onClick={() => { setTab('pos'); setIsCheckout(false); }} />
          <NavTab icon={History} label="Historial" active={tab === 'history'} badge={pendingOffline} onClick={() => setTab('history')} />
          <NavTab icon={Users} label="Clientes" active={tab === 'clients'} badge={0} onClick={() => setTab('clients')} />
          <NavTab icon={TrendingUp} label="Stats" active={tab === 'stats'} badge={0} onClick={() => setTab('stats')} />
        </div>
      </div>
    </div>
  );
}
