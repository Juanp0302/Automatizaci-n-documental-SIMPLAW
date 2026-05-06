import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import { 
  Plus, Trash2, Edit3, Save, X, 
  ChevronDown, ChevronUp, GripVertical, 
  Info, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import '../../styles/extractor.css';

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'boolean', label: 'Sí/No' },
  { value: 'enum', label: 'Lista cerrada' },
  { value: 'list', label: 'Lista abierta' }
];

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#10b981', '#64748b'];

const SchemaEditor = () => {
  const { id: projectId } = useParams();
  const toast = useToast();
  const [docTypes, setDocTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [fields, setFields] = useState([]);
  const [editingType, setEditingType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchDocTypes();
  }, [projectId]);

  const getSafeAliases = (aliases) => {
    if (!aliases) return '';
    if (Array.isArray(aliases)) return aliases.join(', ');
    if (typeof aliases !== 'string') return '';
    
    if (aliases.startsWith('[')) {
      try {
        const parsed = JSON.parse(aliases);
        return Array.isArray(parsed) ? parsed.join(', ') : aliases;
      } catch (e) {
        return aliases;
      }
    }
    return aliases;
  };

  const fetchDocTypes = async () => {
    try {
      const response = await api.get(`/extractor/projects/${projectId}/types`);
      setDocTypes(response.data);
      if (response.data.length > 0 && !selectedType) {
        selectType(response.data[0]);
      }
    } catch (err) {
      toast.error('Error al cargar tipos documentales');
    } finally {
      setLoading(false);
    }
  };

  const selectType = (type) => {
    setSelectedType(type);
    setFields(type.fields || []);
    setDirty(false);
  };

  const handleCreateType = async () => {
    try {
      const response = await api.post(`/extractor/projects/${projectId}/types`, {
        name: 'Nuevo Tipo',
        color: '#3b82f6',
        sort_order: docTypes.length
      });
      setDocTypes([...docTypes, response.data]);
      selectType(response.data);
      setEditingType(response.data);
    } catch (err) {
      toast.error('Error al crear tipo');
    }
  };

  const handleSaveType = async () => {
    try {
      // Filtrar solo los campos que espera DocTypeBase
      const { name, aliases, description, prompt_hint, color, sort_order } = editingType;
      const payload = { name, aliases, description, prompt_hint, color, sort_order };
      
      const response = await api.put(`/extractor/types/${selectedType.id}`, payload);
      setDocTypes(docTypes.map(dt => dt.id === selectedType.id ? response.data : dt));
      setSelectedType(response.data);
      setEditingType(null);
      toast.success('Tipo actualizado');
    } catch (err) {
      console.error('Error saving type:', err);
      const detail = err.response?.data?.detail;
      toast.error(detail ? `Error: ${JSON.stringify(detail)}` : 'Error al guardar cambios');
    }
  };

  const handleSaveFields = async () => {
    setSaving(true);
    try {
      await api.post(`/extractor/types/${selectedType.id}/fields`, fields);
      setDirty(false);
      toast.success('Campos guardados');
    } catch (err) {
      toast.error('Error al guardar campos');
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    const newField = {
      id: `new-${Date.now()}`,
      name: `campo_${fields.length + 1}`,
      label: `Nuevo Campo ${fields.length + 1}`,
      field_type: 'text',
      is_required: false,
      is_multi: false,
      prompt_hint: '',
      excel_column: '',
      sort_order: fields.length
    };
    setFields([...fields, newField]);
    setDirty(true);
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--ei-bg-primary)' }}>
      {/* Sidebar: Types */}
      <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30,41,59,0.2)' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <h3 className="section-title-ei" style={{ marginBottom: 0 }}>Tipos Documentales</h3>
          <button 
            onClick={handleCreateType}
            style={{ padding: '4px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {docTypes.map((dt) => (
            <button
              key={dt.id}
              onClick={() => selectType(dt)}
              className={`
                sidebar-item-ei ${selectedType?.id === dt.id ? 'active' : ''}
              `}
              style={{ borderLeft: selectedType?.id === dt.id ? `2px solid ${dt.color}` : 'none' }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dt.color, flexShrink: 0 }} />
              <span className="truncate">{dt.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Area: Fields */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedType ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--ei-text-muted)' }}>
            <Info size={48} style={{ opacity: 0.1 }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 500, fontStyle: 'italic' }}>Selecciona un tipo para configurar la extracción</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ height: '64px', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(30,41,59,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: selectedType.color }} />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ei-text-primary)', margin: 0 }}>{selectedType.name}</h2>
                {!editingType && (
                  <button onClick={() => setEditingType({...selectedType})} style={{ padding: '4px', color: 'var(--ei-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Edit3 size={16} />
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {dirty && (
                  <button 
                    onClick={handleSaveFields}
                    disabled={saving}
                    className="btn-primary-ei px-4 py-2"
                  >
                    {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    <span>Aplicar Cambios</span>
                  </button>
                )}
                <button 
                  onClick={addField}
                  className="btn-secondary-ei px-4 py-2"
                >
                  <Plus size={16} /> Añadir Campo
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
               {editingType && (
                 <div className="card-ei" style={{ marginBottom: '24px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(59,130,246,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#60a5fa', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Configuración del Tipo</h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleSaveType} className="btn-primary-ei px-4 py-1.5 text-xs">
                          <Save size={14} /> Guardar Cambios
                        </button>
                        <button onClick={() => setEditingType(null)} className="btn-secondary-ei px-4 py-1.5 text-xs">
                          Cancelar
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label className="section-title-ei" style={{ fontSize: '10px', display: 'block', marginBottom: '8px' }}>Nombre del Tipo</label>
                          <input 
                            className="input-ei w-full"
                            value={editingType.name}
                            onChange={(e) => setEditingType({...editingType, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="section-title-ei" style={{ fontSize: '10px', display: 'block', marginBottom: '8px' }}>Color Identificador</label>
                          <div className="flex gap-2">
                            {COLORS.map(c => (
                              <button 
                                key={c}
                                onClick={() => setEditingType({...editingType, color: c})}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${editingType.color === c ? 'border-white' : 'border-transparent'}`}
                                style={{ background: c }}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="section-title-ei" style={{ fontSize: '10px', display: 'block', marginBottom: '8px' }}>Descripción (Opcional)</label>
                          <textarea 
                            className="input-ei w-full"
                            style={{ height: '80px', resize: 'none' }}
                            placeholder="Ej: Contratos de prestación de servicios legales..."
                            value={editingType.description || ''}
                            onChange={(e) => setEditingType({...editingType, description: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="section-title-ei" style={{ fontSize: '10px', display: 'block', marginBottom: '8px' }}>Nombres Alternativos (Separados por coma)</label>
                          <input 
                            className="input-ei w-full"
                            placeholder="Ej: Contrato Prestación, Contrato Servicios, CPS..."
                            value={getSafeAliases(editingType.aliases)}
                            onChange={(e) => {
                              const val = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                              setEditingType({...editingType, aliases: JSON.stringify(val)});
                            }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="section-title-ei" style={{ fontSize: '10px', display: 'block', marginBottom: '8px' }}>Pista de Identificación (Prompt IA)</label>
                        <textarea 
                          className="input-ei w-full"
                          style={{ height: '242px', resize: 'none' }}
                          placeholder="Instrucciones específicas para que la IA identifique este tipo. Ej: 'Busca el encabezado Cláusula de Confidencialidad' o 'Suele tener el logo de la empresa X'..."
                          value={editingType.prompt_hint || ''}
                          onChange={(e) => setEditingType({...editingType, prompt_hint: e.target.value})}
                        />
                        <p style={{ fontSize: '11px', color: 'var(--ei-text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                          Esta información ayuda al clasificador a distinguir este tipo de otros similares.
                        </p>
                      </div>
                    </div>
                 </div>
               )}
               {/* Info Card */}
               <div className="card-ei" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.1)', marginBottom: '24px' }}>
                  <Info size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#94a3b8' }}>
                    <p style={{ fontWeight: 700, color: '#60a5fa', marginBottom: '4px' }}>Guía de Extracción</p>
                    Define etiquetas claras para el LLM. Proporciona instrucciones específicas en el campo de "Pista" para campos difíciles o formatos complejos.
                  </div>
               </div>

              {fields.length === 0 ? (
                <div className="card-ei" style={{ padding: '80px 24px', textAlign: 'center', borderStyle: 'dashed', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <p style={{ color: 'var(--ei-text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No hay campos definidos.</p>
                  <button onClick={addField} style={{ color: '#3b82f6', fontWeight: 700, fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                    + Crear primer campo
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {fields.map((field) => (
                    <FieldRow 
                      key={field.id} 
                      field={field} 
                      onChange={(k, v) => setFields(fields.map(f => f.id === field.id ? {...f, [k]: v} : f))}
                      onDelete={() => setFields(fields.filter(f => f.id !== field.id))}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const FieldRow = ({ field, onChange, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card-ei" style={{ padding: 0, overflow: 'hidden', background: 'rgba(30,41,59,0.4)' }}>
      {/* Main Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
        <div style={{ padding: '4px', color: 'var(--ei-text-muted)', cursor: 'grab' }}>
          <GripVertical size={16} />
        </div>
        <input 
          className="input-ei" 
          style={{ fontSize: '0.75rem', width: '160px', flexShrink: 0 }} 
          placeholder="slug_campo" 
          value={field.name} 
          onChange={e => onChange('name', e.target.value)} 
        />
        <input 
          className="input-ei" 
          style={{ fontSize: '0.75rem', flex: 1 }} 
          placeholder="Etiqueta" 
          value={field.label} 
          onChange={e => onChange('label', e.target.value)} 
        />
        <select 
          className="input-ei" 
          style={{ fontSize: '0.75rem', width: '140px', flexShrink: 0 }} 
          value={field.field_type} 
          onChange={e => onChange('field_type', e.target.value)}
        >
          {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
             <input type="checkbox" style={{ accentColor: '#2563eb', width: '13px', height: '13px' }} checked={field.is_required} onChange={e => onChange('is_required', e.target.checked)} />
             <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ei-text-muted)', textTransform: 'uppercase' }}>Req</span>
          </label>
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ padding: '6px', color: 'var(--ei-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button onClick={onDelete} style={{ padding: '6px', color: 'var(--ei-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <Trash2 size={16} />
        </button>
      </div>

      {/* Expanded Section */}
      {expanded && (
        <div style={{ padding: '16px 56px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', background: 'rgba(0,0,0,0.1)' }}>
          <div>
            <label className="section-title-ei" style={{ fontSize: '10px', display: 'block', marginBottom: '8px' }}>Instrucción para la IA</label>
            <textarea className="input-ei" style={{ fontSize: '0.75rem', height: '96px', resize: 'none', width: '100%' }} placeholder="Pista de extracción..." value={field.prompt_hint || ''} onChange={e => onChange('prompt_hint', e.target.value)} />
          </div>
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label className="section-title-ei" style={{ fontSize: '10px', display: 'block', marginBottom: '8px' }}>Columna Excel</label>
              <input className="input-ei" style={{ fontSize: '0.75rem', width: '100%' }} value={field.excel_column || ''} onChange={e => onChange('excel_column', e.target.value)} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
               <input type="checkbox" style={{ accentColor: '#2563eb', width: '13px', height: '13px' }} checked={field.is_multi} onChange={e => onChange('is_multi', e.target.checked)} />
               <span style={{ fontSize: '0.75rem', color: 'var(--ei-text-secondary)' }}>Permitir múltiples valores</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemaEditor;

