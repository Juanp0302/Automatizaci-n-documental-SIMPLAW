import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Key, Cpu, Save, Globe } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

const Settings = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    openai_api_key: '',
    anthropic_api_key: '',
    gemini_api_key: '',
    deepseek_api_key: '',
    google_cloud_credentials: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/extractor/settings');
      const data = {};
      res.data.forEach(s => {
        data[s.key] = s.value;
      });
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key, value) => {
    setSaving(true);
    try {
      await api.post('/extractor/settings', { key, value });
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ padding: '40px 48px' }}>
      <header style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ padding: '8px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', color: '#3b82f6' }}>
            <SettingsIcon size={20} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ei-text-primary)', margin: 0 }}>Configuración del Motor</h1>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--ei-text-secondary)' }}>
          Gestiona las llaves de API y credenciales de los proveedores de IA y OCR.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        {/* OpenAI */}
        <ProviderCard 
          name="OpenAI" 
          desc="GPT-4o, GPT-4 Turbo, GPT-3.5"
          icon={Cpu}
          color="#10a37f"
          value={settings.openai_api_key}
          onChange={(val) => setSettings({...settings, openai_api_key: val})}
          onSave={() => handleSave('openai_api_key', settings.openai_api_key)}
          saving={saving}
          placeholder="sk-..."
        />

        {/* Anthropic */}
        <ProviderCard 
          name="Anthropic" 
          desc="Claude 3.5 Sonnet, Claude 3 Opus"
          icon={Globe}
          color="#d97757"
          value={settings.anthropic_api_key}
          onChange={(val) => setSettings({...settings, anthropic_api_key: val})}
          onSave={() => handleSave('anthropic_api_key', settings.anthropic_api_key)}
          saving={saving}
          placeholder="sk-ant-..."
        />

        {/* Google Gemini */}
        <ProviderCard 
          name="Google Gemini" 
          desc="Gemini 1.5 Pro, Gemini 1.5 Flash"
          icon={Shield}
          color="#4285f4"
          value={settings.gemini_api_key}
          onChange={(val) => setSettings({...settings, gemini_api_key: val})}
          onSave={() => handleSave('gemini_api_key', settings.gemini_api_key)}
          saving={saving}
          placeholder="AIza..."
        />

        {/* DeepSeek */}
        <ProviderCard 
          name="DeepSeek" 
          desc="DeepSeek-V3, DeepSeek-Chat"
          icon={Key}
          color="#60a5fa"
          value={settings.deepseek_api_key}
          onChange={(val) => setSettings({...settings, deepseek_api_key: val})}
          onSave={() => handleSave('deepseek_api_key', settings.deepseek_api_key)}
          saving={saving}
          placeholder="ds-..."
        />
      </div>

      <div className="card-ei" style={{ marginTop: '40px', padding: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Seguridad de Credenciales</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--ei-text-secondary)', lineHeight: 1.6 }}>
          Tus llaves de API se almacenan de forma segura en tu servidor local. Nunca se comparten con terceros fuera de las solicitudes directas a los proveedores oficiales durante el procesamiento de documentos.
        </p>
      </div>
    </div>
  );
};

const ProviderCard = ({ name, desc, icon: Icon, color, value, onChange, onSave, saving, placeholder }) => (
  <div className="card-ei" style={{ padding: '24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
        <Icon size={20} style={{ margin: 'auto' }} />
      </div>
      <div>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', margin: 0 }}>{name}</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--ei-text-muted)', margin: 0 }}>{desc}</p>
      </div>
    </div>

    <div style={{ display: 'flex', gap: '8px' }}>
      <input 
        type="password"
        className="input-ei"
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, fontSize: '0.75rem' }}
      />
      <button 
        onClick={onSave}
        disabled={saving}
        className="btn-primary-ei"
        style={{ padding: '0 16px', height: '36px' }}
      >
        <Save size={14} />
      </button>
    </div>
  </div>
);

export default Settings;
