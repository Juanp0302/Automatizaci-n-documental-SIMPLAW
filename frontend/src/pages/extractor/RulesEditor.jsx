import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ShieldAlert, Plus, Trash2, Edit2, 
  CheckCircle, AlertCircle, Info, ChevronRight,
  Filter, Play, Save, X, Loader2, Cpu
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

const RulesEditor = () => {
  const { id: projectId } = useParams();
  const toast = useToast();
  const [rules, setRules] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [rulesRes, typesRes] = await Promise.all([
        api.get(`/extractor/projects/${projectId}/rules`),
        api.get(`/extractor/projects/${projectId}/types`),
      ]);
      setRules(rulesRes.data);
      setDocTypes(typesRes.data);
    } catch (err) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta regla?')) return;
    try {
      await api.delete(`/extractor/rules/${id}`);
      setRules(rules.filter(r => r.id !== id));
      toast.success('Regla eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleToggleActive = async (rule) => {
    try {
        await api.put(`/extractor/rules/${rule.id}`, { is_active: !rule.is_active });
        setRules(rules.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
    } catch {
        toast.error('Error al actualizar estado');
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ padding: '40px 48px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '8px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', color: '#3b82f6' }}>
              <ShieldAlert size={20} />
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ei-text-primary)', margin: 0 }}>Motor de Reglas</h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--ei-text-secondary)' }}>
            Define lógica automática para validar y enriquecer los datos extraídos.
          </p>
        </div>
        <button 
          onClick={() => { setEditingRule(null); setIsModalOpen(true); }}
          className="btn-primary-ei"
        >
          <Plus size={16} /> Nueva Regla
        </button>
      </header>

      {rules.length === 0 ? (
        <div className="card-ei" style={{ padding: '80px 40px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
             <ShieldAlert size={24} style={{ color: 'var(--ei-text-muted)' }} />
          </div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>No hay reglas configuradas</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--ei-text-secondary)', maxWidth: '300px', margin: '0 auto 24px' }}>
            Las reglas te permiten automatizar la validación de tus documentos y detectar errores de negocio.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '8px 20px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer' }}
          >
            Crear mi primera regla
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {rules.map(rule => (
            <div key={rule.id} className="card-ei group" style={{ padding: '20px 24px', opacity: rule.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <SeverityIcon severity={rule.severity} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', margin: 0 }}>{rule.name}</h3>
                      <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--ei-text-muted)', textTransform: 'uppercase' }}>
                        {docTypes.find(t => t.id === rule.doc_type_id)?.name || 'Todos los tipos'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ei-text-secondary)', margin: 0 }}>{rule.description}</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Toggle */}
                  <div 
                    onClick={() => handleToggleActive(rule)}
                    style={{ 
                      width: '36px', height: '18px', borderRadius: '9px', 
                      background: rule.is_active ? '#2563eb' : 'rgba(255,255,255,0.1)',
                      position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                    }}
                  >
                    <div style={{ 
                        width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: '2px', left: rule.is_active ? '20px' : '2px',
                        transition: 'all 0.3s'
                    }} />
                  </div>

                  <div className="h-4 w-px bg-white/5 mx-2" />

                  <button className="p-2 hover:text-white transition-colors" style={{ color: 'var(--ei-text-muted)' }} onClick={() => { setEditingRule(rule); setIsModalOpen(true); }}>
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2 hover:text-red-400 transition-colors" style={{ color: 'var(--ei-text-muted)' }} onClick={() => handleDelete(rule.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rule Modal */}
      {isModalOpen && (
        <RuleModal 
          onClose={() => setIsModalOpen(false)} 
          projectId={projectId}
          docTypes={docTypes}
          rule={editingRule}
          onSave={fetchData}
        />
      )}
    </div>
  );
};

const SeverityIcon = ({ severity }) => {
  if (severity === 'error')   return <AlertCircle size={20} style={{ color: '#f87171' }} />;
  if (severity === 'warning') return <AlertCircle size={20} style={{ color: '#fbbf24' }} />;
  return <Info size={20} style={{ color: '#60a5fa' }} />;
};

const RuleModal = ({ onClose, projectId, docTypes, rule, onSave }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState(rule ? {
    ...rule,
    condition_json: rule.condition_json ? JSON.parse(rule.condition_json) : []
  } : {
    name: '',
    description: '',
    doc_type_id: '',
    severity: 'warning',
    logic_type: 'simple',
    action_type: 'alert',
    is_active: true,
    condition_json: []
  });

  useEffect(() => {
    fetchFields();
  }, [formData.doc_type_id]);

  const fetchFields = async () => {
    try {
      const url = formData.doc_type_id 
        ? `/extractor/types/${formData.doc_type_id}/fields`
        : `/extractor/projects/${projectId}/fields`;
      const res = await api.get(url);
      setFields(res.data);
    } catch {
      console.warn('Error fetching fields for rules');
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      condition_json: [...formData.condition_json, { field: '', operator: '==', value: '' }]
    });
  };

  const removeCondition = (index) => {
    const newConds = [...formData.condition_json];
    newConds.splice(index, 1);
    setFormData({ ...formData, condition_json: newConds });
  };

  const updateCondition = (index, key, val) => {
    const newConds = [...formData.condition_json];
    newConds[index][key] = val;
    setFormData({ ...formData, condition_json: newConds });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = {
        ...formData,
        doc_type_id: formData.doc_type_id ? parseInt(formData.doc_type_id) : null,
        condition_json: JSON.stringify(formData.condition_json)
    };

    try {
      if (rule) {
        await api.put(`/extractor/rules/${rule.id}`, payload);
        toast.success('Regla actualizada');
      } else {
        await api.post(`/extractor/projects/${projectId}/rules`, payload);
        toast.success('Regla creada');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error('Error al guardar la regla');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="card-ei animate-slide-up" style={{ width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              {rule ? 'Editar Regla' : 'Nueva Regla Automática'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--ei-text-secondary)', marginTop: '4px' }}>
              Define la lógica y severidad de la alerta.
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--ei-text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ei-text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Nombre</label>
              <input required className="input-ei" placeholder="Ej: Monto Alto" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ei-text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Documento</label>
              <select className="input-ei" value={formData.doc_type_id} onChange={e => setFormData({...formData, doc_type_id: e.target.value})}>
                <option value="">Cualquiera</option>
                {docTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ei-text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Tipo Lógica</label>
              <select className="input-ei" value={formData.logic_type} onChange={e => setFormData({...formData, logic_type: e.target.value})}>
                <option value="simple">Atributos</option>
                <option value="llm">Razonamiento IA</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ei-text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Severidad</label>
              <select className="input-ei" value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})}>
                <option value="info">Info</option>
                <option value="warning">Aviso</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ei-text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Descripción del Error</label>
            <input className="input-ei" placeholder="Ej: El documento contiene hallazgos críticos..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          {formData.logic_type === 'llm' ? (
            <div style={{ padding: '24px', background: 'rgba(96,165,250,0.05)', borderRadius: '12px', border: '1px solid rgba(96,165,250,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <Cpu size={16} style={{ color: '#60a5fa' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Instrucción para la IA (Prompt)</span>
                </div>
                <textarea 
                    className="input-ei"
                    style={{ minHeight: '120px', fontSize: '12px', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)' }}
                    placeholder="Ej: Analiza si en este acto administrativo se imputan más de 3 cargos. Responde solo con SI o NO."
                    value={formData.prompt || ''}
                    onChange={e => setFormData({...formData, prompt: e.target.value})}
                />
                <p style={{ fontSize: '10px', color: 'var(--ei-text-muted)', marginTop: '12px', fontStyle: 'italic' }}>
                    * El motor de IA analizará el texto completo del documento para responder a esta instrucción.
                </p>
            </div>
          ) : (
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Filter size={14} style={{ color: '#60a5fa' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Condiciones de Atributos</span>
                </div>
                <button type="button" onClick={addCondition} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Añadir Condición
                </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {formData.condition_json.length === 0 ? (
                    <p style={{ fontSize: '10px', color: 'var(--ei-text-muted)', textAlign: 'center', padding: '10px', fontStyle: 'italic' }}>
                    No hay condiciones. La regla se aplicará siempre.
                    </p>
                ) : (
                    formData.condition_json.map((cond, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 32px', gap: '8px', alignItems: 'center' }}>
                        <select className="input-ei" style={{ fontSize: '11px', height: '32px' }} value={cond.field} onChange={e => updateCondition(idx, 'field', e.target.value)}>
                            <option value="">Seleccionar Campo</option>
                            {fields.map(f => <option key={f.id} value={f.name}>{f.label || f.name}</option>)}
                        </select>
                        <select className="input-ei" style={{ fontSize: '11px', height: '32px' }} value={cond.operator} onChange={e => updateCondition(idx, 'operator', e.target.value)}>
                            <option value="==">==</option>
                            <option value="!=">!=</option>
                            <option value=">">&gt;</option>
                            <option value="<">&lt;</option>
                            <option value="contains">contiene</option>
                        </select>
                        <input className="input-ei" style={{ fontSize: '11px', height: '32px' }} placeholder="Valor" value={cond.value} onChange={e => updateCondition(idx, 'value', e.target.value)} />
                        <button type="button" onClick={() => removeCondition(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                    ))
                )}
                </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
               Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary-ei" style={{ flex: 2, height: '44px', borderRadius: '10px', fontSize: '0.875rem', justifyContent: 'center' }}>
               {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
               {rule ? 'Actualizar Regla' : 'Crear Regla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RulesEditor;
