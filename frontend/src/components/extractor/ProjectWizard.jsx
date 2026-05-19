import React, { useState } from 'react';
import { X, ChevronRight, FolderOpen, Check, Wand2, BrainCircuit } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import '../../styles/extractor.css';

const STEPS = ['Información', 'Motor IA', 'Carpeta', 'Confirmar'];

const LLM_OPTIONS = [
  { id: 'openai',    name: 'OpenAI (GPT-4o)',    models: ['gpt-4o-mini', 'gpt-4o'] },
  { id: 'anthropic', name: 'Claude 3.5 Sonnet',  models: ['claude-3-5-sonnet-20240620', 'claude-3-5-sonnet-20240620'] },
  { id: 'kimi',      name: 'Kimi AI',            models: ['moonshot-v1-8k', 'moonshot-v1-8k'] },
];

const FILE_MODES = [
  { value: 'analyze', label: 'Analizar', desc: 'Sin mover archivos' },
  { value: 'copy',    label: 'Copiar',   desc: 'Mantiene originales' },
  { value: 'move',    label: 'Mover',    desc: 'Reorganiza archivos' },
];

const ProjectWizard = ({ onClose, onCreated }) => {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pickingFolder, setPickingFolder] = useState(false);

  const [data, setData] = useState({
    name: '', client: '', description: '',
    connector_llm: 'openai',
    llm_classify_model: 'gpt-4o-mini',
    llm_extract_model: 'gpt-4o',
    root_folder: '', file_mode: 'analyze',
    confidence_threshold: 0.7,
  });

  const update = (key, value) => setData(prev => ({ ...prev, [key]: value }));

  const selectLLM = (opt) => {
    setData(prev => ({
      ...prev,
      connector_llm: opt.id,
      llm_classify_model: opt.models[0],
      llm_extract_model: opt.models[1],
    }));
  };

  const wizardFolderRef = React.useRef(null);

  const handleSelectFolder = () => {
    if (wizardFolderRef.current) {
      wizardFolderRef.current.click();
    }
  };

  const handleWizardFolderSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const folderName = files[0]?.webkitRelativePath?.split('/')[0] || 'Carpeta seleccionada';
    update('root_folder', folderName);
    setPickingFolder(false);
    e.target.value = '';
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/extractor/projects', data);
      toast.success('Proyecto creado con éxito');
      onCreated(res.data.id);
    } catch {
      toast.error('Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const canNext = step === 0 ? data.name.trim().length > 0 : true;

  // ──────────── Render ────────────

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.65)' }}>

      <div className="card-ei w-full max-w-lg flex flex-col max-h-[90vh]"
           style={{ background: 'var(--ei-bg-secondary)' }}>

        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between flex-shrink-0"
             style={{ background: 'rgba(0,0,0,0.15)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Wand2 size={16} className="text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--ei-text-primary)' }}>Nuevo proyecto</h2>
              <p className="text-[10px]" style={{ color: 'var(--ei-text-muted)' }}>
                Paso {step + 1} de {STEPS.length} — {STEPS[step]}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--ei-text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-4 flex gap-2 flex-shrink-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-1 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-blue-500' : ''
              }`} style={i > step ? { background: 'var(--ei-bg-tertiary)' } : {}} />
              <span className="text-[9px]" style={{ color: i <= step ? '#60a5fa' : 'var(--ei-text-muted)' }}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Content (scrollable) */}
        <div className="p-6 flex-1 overflow-y-auto">

          {/* Step 0 — Información */}
          {step === 0 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--ei-text-primary)' }}>
                Información del proyecto
              </h3>
              <div>
                <label className="label-ei">Nombre del proyecto <span className="text-red-400">*</span></label>
                <input className="input-ei" placeholder="ej. Auditoría Contable 2024"
                       value={data.name} onChange={e => update('name', e.target.value)} autoFocus />
              </div>
              <div>
                <label className="label-ei">Cliente (opcional)</label>
                <input className="input-ei" placeholder="ej. Ministerio de Justicia"
                       value={data.client} onChange={e => update('client', e.target.value)} />
              </div>
              <div>
                <label className="label-ei">Descripción (opcional)</label>
                <textarea className="input-ei resize-none" rows={3} placeholder="Descripción del proyecto..."
                          value={data.description} onChange={e => update('description', e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 1 — Motor IA */}
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--ei-text-primary)' }}>
                Motor de Inteligencia Artificial
              </h3>
              {LLM_OPTIONS.map(opt => (
                <button key={opt.id} type="button" onClick={() => selectLLM(opt)}
                  className="p-3 rounded-lg border text-left transition-all flex items-center gap-3"
                  style={{
                    borderColor: data.connector_llm === opt.id ? '#3b82f6' : 'var(--ei-border)',
                    background: data.connector_llm === opt.id ? 'rgba(59,130,246,0.1)' : 'var(--ei-bg-tertiary)',
                    color: 'var(--ei-text-primary)',
                  }}>
                  <BrainCircuit size={18} style={{ color: data.connector_llm === opt.id ? '#60a5fa' : 'var(--ei-text-muted)' }} />
                  <span className="text-xs font-semibold">{opt.name}</span>
                  {data.connector_llm === opt.id && <Check size={14} className="ml-auto text-blue-400" />}
                </button>
              ))}
              <p className="text-[10px] italic" style={{ color: 'var(--ei-text-muted)' }}>
                Modelo seleccionado: {data.llm_extract_model}
              </p>
            </div>
          )}

          {/* Step 2 — Carpeta */}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--ei-text-primary)' }}>
                Carpeta de documentos
              </h3>
              <p className="text-sm" style={{ color: 'var(--ei-text-secondary)' }}>
                Selecciona la carpeta raíz donde están los documentos.
              </p>

              {/* Input oculto para selección de carpeta */}
              <input
                type="file"
                ref={wizardFolderRef}
                hidden
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleWizardFolderSelected}
              />

              <div>
                <label className="label-ei">Carpeta raíz</label>
                <div className="flex gap-2">
                  <input className="input-ei flex-1" placeholder="Selecciona una carpeta..."
                         value={data.root_folder} readOnly />
                  <button type="button" onClick={handleSelectFolder} disabled={pickingFolder}
                    className="btn-secondary-ei flex-shrink-0">
                    {pickingFolder
                      ? <div className="w-4 h-4 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
                      : <><FolderOpen size={15} /> Explorar</>
                    }
                  </button>
                </div>
              </div>

              <div>
                <label className="label-ei">Modo de procesamiento</label>
                <div className="grid grid-cols-3 gap-2">
                  {FILE_MODES.map(opt => (
                    <button key={opt.value} type="button" onClick={() => update('file_mode', opt.value)}
                      className="p-3 rounded-lg border text-left transition-all"
                      style={{
                        borderColor: data.file_mode === opt.value ? '#3b82f6' : 'var(--ei-border)',
                        background: data.file_mode === opt.value ? 'rgba(59,130,246,0.1)' : 'var(--ei-bg-tertiary)',
                        color: 'var(--ei-text-primary)',
                      }}>
                      <p className="text-xs font-semibold">{opt.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--ei-text-muted)' }}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-ei">
                  Umbral de confianza mínima: {Math.round(data.confidence_threshold * 100)}%
                </label>
                <input type="range" min={40} max={95} step={5}
                       value={data.confidence_threshold * 100}
                       onChange={e => update('confidence_threshold', parseInt(e.target.value) / 100)}
                       className="w-full accent-blue-500" />
                <p className="text-xs mt-1" style={{ color: 'var(--ei-text-muted)' }}>
                  Clasificaciones por debajo de este umbral irán a revisión humana
                </p>
              </div>
            </div>
          )}

          {/* Step 3 — Confirmar */}
          {step === 3 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--ei-text-primary)' }}>
                Confirmar y crear
              </h3>
              <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--ei-bg-tertiary)' }}>
                <SummaryRow label="Nombre"    value={data.name} />
                {data.client && <SummaryRow label="Cliente" value={data.client} />}
                {data.root_folder && <SummaryRow label="Carpeta" value={data.root_folder} />}
                <SummaryRow label="Modo"      value={FILE_MODES.find(m => m.value === data.file_mode)?.label || data.file_mode} />
                <SummaryRow label="Motor IA"  value={data.connector_llm.toUpperCase()} />
                <SummaryRow label="Umbral"    value={`${Math.round(data.confidence_threshold * 100)}%`} />
              </div>
            </div>
          )}
        </div>

        {/* Footer (fixed) */}
        <div className="p-5 border-t border-white/5 flex items-center justify-between flex-shrink-0"
             style={{ background: 'rgba(0,0,0,0.1)' }}>
          <button type="button" className="btn-secondary-ei"
                  onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
                  disabled={loading}>
            {step === 0 ? <><X size={15} /> Cancelar</> : 'Atrás'}
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" className="btn-primary-ei" disabled={!canNext}
                    onClick={() => setStep(s => s + 1)}>
              Siguiente <ChevronRight size={15} />
            </button>
          ) : (
            <button type="button" className="btn-primary-ei" disabled={loading}
                    onClick={handleCreate}>
              {loading
                ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                : <><Check size={15} /> Crear proyecto</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryRow = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm">
    <span style={{ color: 'var(--ei-text-secondary)' }}>{label}</span>
    <span className="font-medium text-right max-w-xs truncate" style={{ color: 'var(--ei-text-primary)' }}>
      {value}
    </span>
  </div>
);

export default ProjectWizard;
