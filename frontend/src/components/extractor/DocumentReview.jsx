import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
  X, Check, AlertTriangle, Send, Save, 
  FileText, History, Info, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DocumentReview = ({ docId, onClose, onUpdate }) => {
  const [document, setDocument] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [docId]);

  const fetchData = async () => {
    try {
      const [docRes, tempRes] = await Promise.all([
        api.get(`/extractor/documents/${docId}`),
        api.get('/templates')
      ]);
      setDocument(docRes.data);
      setTemplates(tempRes.data);
    } catch (err) {
      console.error('Error fetching review data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToAutomation = () => {
    if (!selectedTemplate) return;
    
    // Convert extracted fields to a flat object for pre-filling
    const prefill = {};
    document.field_values.forEach(fv => {
      prefill[fv.field_name] = fv.normalized_value || fv.raw_value;
    });

    navigate(`/documents/new?templateId=${selectedTemplate}`, { 
      state: { prefill } 
    });
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-bg-primary w-full max-w-5xl h-[90vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-bg-secondary">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-light text-primary rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">{document.file_name}</h2>
              <p className="text-xs text-gray-400">Revisión de Extracción</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-full text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Fields List */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-border space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Campos Extraídos</h3>
              <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full border border-accent/20">
                {document.field_values.length} campos
              </span>
            </div>

            <div className="space-y-4">
              {document.field_values.map((fv) => (
                <div key={fv.id} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-gray-300">{fv.field_label || fv.field_name}</label>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${
                        (fv.confidence || 0) > 0.8 ? 'text-green-500' : 'text-yellow-500'
                      }`}>
                        {Math.round((fv.confidence || 0) * 100)}% conf.
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      className="form-input text-sm py-2.5 bg-bg-secondary border-border focus:border-primary"
                      value={fv.normalized_value || fv.raw_value || ''}
                      readOnly
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check size={14} className="text-accent" />
                    </div>
                  </div>
                  {fv.source_text && (
                    <p className="text-[10px] text-gray-500 mt-1 italic line-clamp-1">
                      Soporte: "{fv.source_text}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Actions & Preview Hint */}
          <div className="w-full md:w-1/2 p-6 bg-bg-tertiary flex flex-col gap-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Acciones de Integración</h3>
              
              <div className="card bg-surface border-primary/20 p-5 space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <Send size={24} />
                  <h4 className="font-bold text-white">Enviar a Automatización</h4>
                </div>
                <p className="text-sm text-gray-400">
                  Usa los datos extraídos para generar un nuevo documento legal a partir de una plantilla.
                </p>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 font-bold uppercase">Seleccionar Plantilla</label>
                  <select 
                    className="form-select text-sm"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                  >
                    <option value="">Elegir plantilla...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={handleSendToAutomation}
                  disabled={!selectedTemplate}
                  className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  <span>Proceder a Generación</span>
                </button>
              </div>

              <div className="card p-5 space-y-4 border-dashed">
                <div className="flex items-center gap-3 text-gray-400">
                  <Save size={24} />
                  <h4 className="font-bold text-white">Exportar Individual</h4>
                </div>
                <p className="text-sm text-gray-400">Descarga estos datos en formato JSON o CSV para uso externo.</p>
                <div className="flex gap-2">
                  <button className="btn btn-secondary flex-1 py-2 text-xs">JSON</button>
                  <button className="btn btn-secondary flex-1 py-2 text-xs">CSV</button>
                </div>
              </div>
            </div>

            <div className="mt-auto p-4 bg-bg-secondary rounded-xl border border-border">
              <div className="flex items-start gap-3">
                <Info size={16} className="text-blue-400 mt-0.5" />
                <p className="text-[11px] text-gray-400">
                  Los datos marcados con <span className="text-yellow-500 font-bold">confianza baja</span> deben ser verificados manualmente antes de proceder a la generación del documento final.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentReview;
