import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  Settings as SettingsIcon, 
  Printer, 
  Coins, 
  Shield, 
  Save,
  CheckCircle2,
  RefreshCcw,
  Smartphone,
  Database
} from 'lucide-react';
import UsersPage from './Users'; // We can reuse the existing Users component as a tab

export default function Settings() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'print' | 'currency' | 'users'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Local Settings States
  const [config, setConfig] = useState({
    printerName: localStorage.getItem('erp_printer') || 'Ticketera Termica 80mm',
    printerMode: localStorage.getItem('erp_printer_mode') || 'direct',
    mainCurrency: 'USD',
    localCurrency: 'PEN',
    exchangeRate: '3.75'
  });

  const handleSave = () => {
    setIsSaving(true);
    // Save to localStorage for demo persistence
    localStorage.setItem('erp_printer', config.printerName);
    localStorage.setItem('erp_printer_mode', config.printerMode);
    
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const TabButton = ({ id, icon: Icon, label }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-4 border-b-2 transition-all ${
        activeTab === id 
          ? 'border-accent text-accent bg-accent/5' 
          : 'border-transparent text-text-dim hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={18} />
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <SettingsIcon className="text-accent" />
            Configuración del Sistema
          </h1>
          <p className="text-text-dim mt-1">Personaliza el comportamiento y periféricos de NexusDist</p>
        </div>
        
        {activeTab !== 'users' && (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-accent text-bg-dark px-8 py-3 rounded-2xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            {isSaving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        )}
      </div>

      <div className="glass rounded-[2rem] border-white/5 overflow-hidden flex flex-col">
        <div className="flex border-b border-white/10 bg-white/5 overflow-x-auto custom-scrollbar">
          <TabButton id="general" icon={Database} label="General" />
          <TabButton id="print" icon={Printer} label="Impresora" />
          <TabButton id="currency" icon={Coins} label="Monedas" />
          <TabButton id="users" icon={Shield} label="Roles y Permisos" />
        </div>

        <div className="p-8">
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-400 text-sm animate-in zoom-in-95">
              <CheckCircle2 size={18} />
              Configuración actualizada correctamente
            </div>
          )}

          {activeTab === 'general' && (
            <div className="max-w-2xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase ml-1">Nombre de la Empresa</label>
                    <input type="text" defaultValue="NexusDist Wholesale" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-accent" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase ml-1">RUC / ID Fiscal</label>
                    <input type="text" defaultValue="20601234567" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-accent" />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-text-dim uppercase ml-1">Dirección Legal</label>
                 <input type="text" defaultValue="Av. Principal 123, Lima - Perú" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-accent" />
              </div>
            </div>
          )}

          {activeTab === 'print' && (
            <div className="max-w-2xl space-y-8">
              <div className="p-6 bg-accent/5 border border-accent/10 rounded-3xl flex gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
                    <Printer size={32} />
                 </div>
                 <div>
                    <h3 className="font-bold text-white mb-1">Configuración de Ticketera</h3>
                    <p className="text-sm text-text-dim">Configura la impresora térmica para la emisión instantánea de boletas y facturas.</p>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase ml-1">Dispositivo Seleccionado</label>
                  <select 
                    value={config.printerName}
                    onChange={e => setConfig({...config, printerName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-accent appearance-none"
                  >
                    <option value="Ticketera Termica 80mm" className="bg-bg-dark">Ticketera Termica 80mm (Default)</option>
                    <option value="Zebra ZD220" className="bg-bg-dark">Zebra ZD220 (Etiquetas)</option>
                    <option value="One-Note Print" className="bg-bg-dark">Microsoft Print to PDF</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <label className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                    <input type="radio" name="mode" className="hidden" />
                    <p className="font-bold text-white text-sm">Impresión Automática</p>
                    <p className="text-[10px] text-text-dim uppercase">Al confirmar venta</p>
                  </label>
                  <label className="flex-1 p-4 border-2 border-accent/50 bg-accent/5 rounded-2xl cursor-pointer">
                    <input type="radio" name="mode" className="hidden" defaultChecked />
                    <p className="font-bold text-white text-sm">Confirmación Manual</p>
                    <p className="text-[10px] text-accent uppercase">Mostrar vista previa</p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'currency' && (
            <div className="max-w-2xl space-y-8">
              <div className="grid grid-cols-1 gap-8">

                 <div className="glass p-6 rounded-3xl border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg"><RefreshCcw size={20}/></div>
                       <h4 className="font-bold text-white">Moneda Local del Sistema</h4>
                    </div>
                     <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none">
                        <option value="PEN" className="bg-bg-dark">Soles Peruanos (PEN)</option>
                        <option value="COP" className="bg-bg-dark">Pesos Colombianos (COP)</option>
                        <option value="ARS" className="bg-bg-dark">Pesos Argentinos (ARS)</option>
                        <option value="MXN" className="bg-bg-dark">Pesos Mexicanos (MXN)</option>
                     </select>
                 </div>
              </div>

            </div>
          )}

          {activeTab === 'users' && <UsersPage />}
        </div>
      </div>
    </div>
  );
}
