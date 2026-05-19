import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { 
  FileText, Inbox, Database, ShieldAlert, BarChart2,
  AlertCircle, CheckCircle2, Clock, Upload, ChevronRight, FolderOpen, RotateCw, Loader2
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import '../../styles/extractor.css';

const ProjectDetail = () => {
  const { id: projectId } = useParams();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, errors: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState([
    { type: 'sys', msg: 'Conectado al motor de extracción...' },
    { type: 'ready', msg: 'Esperando inicio de proceso...' }
  ]);

  const [rulesCount, setRulesCount] = useState(0);

  useEffect(() => {
    fetchData();
    // fetchLogs interval removed because it was undefined and causing a crash
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [projRes, docsRes, rulesRes] = await Promise.all([
        api.get(`/extractor/projects/${projectId}`),
        api.get(`/extractor/projects/${projectId}/documents`),
        api.get(`/extractor/projects/${projectId}/rules`)
      ]);
      
      if (projRes && projRes.data) {
        setProject(projRes.data);
      }
      
      if (docsRes && docsRes.data) {
        updateStats(docsRes.data);
      }

      if (rulesRes && Array.isArray(rulesRes.data)) {
        const aiRules = rulesRes.data.filter(r => r && r.logic_type === 'llm' && r.is_active).length;
        setRulesCount(aiRules);
      }
    } catch (err) {
      console.error('Fetch error in ProjectDetail:', err);
      const errorDetail = err.response?.data?.detail || err.message;
      toast.error(`Error al cargar datos del proyecto: ${errorDetail}`);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (docs) => {
    setStats({
      total:     docs.length,
      pending:   docs.filter(d => d.review_status === 'pending').length,
      completed: docs.filter(d => d.status === 'completed' && (d.review_status === 'approved' || d.review_status === 'rejected')).length,
      errors:    docs.filter(d => d.status === 'error').length,
    });
  };

  // Referencia al input oculto para seleccionar carpeta
  const folderInputRef = React.useRef(null);
  // Archivos seleccionados de la carpeta
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFolderName, setSelectedFolderName] = useState('');

  const handleSelectFolder = () => {
    // Trigger el input oculto de selección de carpeta
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  const handleFolderSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Filtrar solo PDFs e imágenes
    const validFiles = files.filter(f => {
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      return ['.pdf', '.jpg', '.jpeg', '.png'].includes(ext);
    });

    // Obtener nombre de la carpeta raíz desde webkitRelativePath
    const folderName = files[0]?.webkitRelativePath?.split('/')[0] || 'Carpeta seleccionada';
    
    setSelectedFiles(validFiles);
    setSelectedFolderName(folderName);
    
    // Guardar el nombre en el proyecto
    api.put(`/extractor/projects/${projectId}`, { root_folder: folderName })
      .then(() => {
        setProject(prev => ({ ...prev, root_folder: folderName }));
      })
      .catch(() => {});

    setLogs(prev => [...prev, { type: 'info', msg: `Carpeta "${folderName}" seleccionada: ${validFiles.length} archivos válidos de ${files.length} totales.` }]);
    toast.success(`Carpeta seleccionada: ${validFiles.length} archivos encontrados`);
    
    // Reset el input para permitir re-selección de la misma carpeta
    e.target.value = '';
  };

  const handleStartExtraction = async () => {
    if (selectedFiles.length === 0) return toast.error('Selecciona una carpeta primero');
    
    setSaving(true);
    setLogs(prev => [...prev, { type: 'sys', msg: `Iniciando envío de ${selectedFiles.length} archivos...` }]);
    
    try {
      // Subir en lotes de 5 para evitar límite de tamaño
      const BATCH_SIZE = 5;
      let totalUploaded = 0;
      
      for (let i = 0; i < selectedFiles.length; i += BATCH_SIZE) {
        const batch = selectedFiles.slice(i, i + BATCH_SIZE);
        const formData = new FormData();
        batch.forEach(f => formData.append('files', f));
        
        await api.post(`/extractor/projects/${projectId}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        });
        totalUploaded += batch.length;
        setLogs(prev => [...prev.slice(-10), { type: 'info', msg: `Enviados ${totalUploaded}/${selectedFiles.length} archivos...` }]);
      }

      setLogs(prev => [
        ...prev, 
        { type: 'info', msg: `${selectedFiles.length} archivos enviados al motor.` },
        { type: 'ai', msg: 'Motor IA iniciado. Procesando documentos...' }
      ]);
      toast.success(`Extracción iniciada: ${selectedFiles.length} archivos en cola`);
      setSelectedFiles([]);
      fetchData();
      startPolling();
    } catch (err) {
      setLogs(prev => [...prev, { type: 'error', msg: 'Error: ' + err.message }]);
      toast.error('Error al iniciar extracción: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const startPolling = () => {
    const interval = setInterval(async () => {
        try {
            const res = await api.get(`/extractor/projects/${projectId}/documents`);
            const docs = res.data;
            updateStats(docs);
            
            const processing = docs.filter(d => d.status === 'processing');
            if (processing.length > 0) {
                setLogs(prev => [
                    ...prev.slice(-10), // Mantener solo los últimos 10
                    { type: 'info', msg: `Procesando: ${processing[0].file_name}...` }
                ]);
            } else if (docs.every(d => d.status === 'completed' || d.status === 'error')) {
                setLogs(prev => [...prev, { type: 'sys', msg: 'PROCESO FINALIZADO.' }]);
                clearInterval(interval);
            }
        } catch (e) {
            clearInterval(interval);
        }
    }, 3000);
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setSaving(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }

    try {
        setLogs(prev => [...prev, { type: 'sys', msg: `Subiendo ${files.length} archivos...` }]);
        await api.post(`/extractor/projects/${projectId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Archivos subidos y en cola de procesamiento');
        fetchData();
        startPolling();
    } catch (err) {
        toast.error('Error al subir archivos');
    } finally {
        setSaving(false);
    }
  };
    const handleReprocessAll = async () => {
        if (!window.confirm('¿Deseas volver a procesar TODOS los documentos de este proyecto con la nueva configuración de IA?')) return;
        
        setSaving(true);
        setLogs(prev => [...prev, { type: 'sys', msg: 'Iniciando re-procesamiento masivo...' }]);
        
        try {
            const res = await api.post(`/extractor/projects/${projectId}/reprocess`);
            toast.success(res.data.message || 'Reprocesamiento masivo iniciado');
            setLogs(prev => [...prev, { type: 'info', msg: res.data.message }]);
            
            // Refrescar datos y empezar a monitorear
            fetchData();
            startPolling();
        } catch (err) {
            console.error('Error in handleReprocessAll:', err);
            toast.error('Error al solicitar re-procesamiento masivo');
            setLogs(prev => [...prev, { type: 'error', msg: 'Error al iniciar re-procesamiento.' }]);
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link to="/extractor" style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--ei-text-muted)', textDecoration: 'none' }}>Proyectos</Link>
            <ChevronRight size={12} style={{ color: 'var(--ei-text-muted)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--ei-text-secondary)' }}>
              {project?.client || 'General'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ei-text-primary)', margin: 0 }}>{project?.name}</h1>
          <p style={{ fontSize: '0.875rem', marginTop: '4px', color: 'var(--ei-text-secondary)' }}>
            {project?.description || 'Gestiona la extracción de información para este lote de documentos.'}
          </p>
        </div>
        <input 
          type="file" 
          id="file-upload" 
          multiple 
          hidden 
          onChange={handleUpload} 
        />
        {/* Input oculto para selección de carpeta */}
        <input
          type="file"
          ref={folderInputRef}
          hidden
          webkitdirectory="true"
          directory="true"
          multiple
          onChange={handleFolderSelected}
        />
        <button 
          className="btn-primary-ei" 
          onClick={() => document.getElementById('file-upload').click()}
          disabled={saving}
        >
          <Upload size={16} /> {saving ? 'Subiendo...' : 'Subir Documentos'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <StatCard label="Total Documentos"     value={stats.total}     icon={FileText}     color="blue" />
        <StatCard label="Pendientes Revisión"  value={stats.pending}   icon={Clock}        color="yellow" />
        <StatCard label="Procesados OK"        value={stats.completed} icon={CheckCircle2} color="green" />
        <StatCard label="Errores"              value={stats.errors}    icon={AlertCircle}  color="red" />
      </div>

      {/* Extraction Control Center */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
         {/* Control Panel */}
         <div className="card-ei" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(30,41,59,0.4) 0%, rgba(15,23,42,0.4) 100%)',
            border: '1px solid rgba(59,130,246,0.1)'
         }}>
            <div>
               <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Control de Extracción</h2>
               <p style={{ fontSize: '0.8125rem', color: 'var(--ei-text-secondary)', marginBottom: '20px' }}>
                  Ejecuta el análisis masivo de documentos usando el motor configurado.
               </p>

               {/* Folder Selection Row */}
               <div style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  borderRadius: '12px', 
                  padding: '12px 16px', 
                  marginBottom: '24px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
               }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                     <FolderOpen size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />
                     <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '9px', color: 'var(--ei-text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>Carpeta de Origen</p>
                        <p style={{ fontSize: '0.75rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                           {project?.root_folder || 'No seleccionada'}
                        </p>
                     </div>
                  </div>
                  <button 
                     onClick={handleSelectFolder}
                     style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#fff',
                        cursor: 'pointer'
                     }}
                  >
                     Cambiar
                  </button>
               </div>
               
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                   <div style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: '9px', color: 'var(--ei-text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Costo Estimado</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4ade80' }}>
                         ${(stats.total * (0.045 + (rulesCount * 0.01))).toFixed(2)}
                      </p>
                      <p style={{ fontSize: '8px', color: 'var(--ei-text-muted)', marginTop: '2px' }}>
                        Incluye {rulesCount} reglas de IA
                      </p>
                   </div>
                   <div style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: '9px', color: 'var(--ei-text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Docs en Cola</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa' }}>{stats.total}</p>
                   </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={handleStartExtraction}
                  className="btn-primary-ei" 
                  style={{ flex: 2, height: '48px', fontSize: '0.9rem', justifyContent: 'center' }}
                >
                  <CheckCircle2 size={18} /> Iniciar Extracción Masiva
                </button>
                <button 
                  onClick={handleReprocessAll}
                  disabled={saving}
                  className="btn-secondary-ei" 
                  style={{ 
                    flex: 1, 
                    height: '48px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px', 
                    background: 'rgba(255,255,255,0.05)', 
                    color: '#fff', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px', 
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.5 : 1
                  }}
                  title="Re-procesar todo con IA"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <RotateCw size={18} />}
                </button>
            </div>
          </div>

         {/* Logs Console */}
         <div className="card-ei" style={{ 
            background: '#0a0f18', 
            border: '1px solid #1e293b', 
            height: '240px', 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column',
            fontFamily: 'monospace',
            fontSize: '11px',
            overflow: 'hidden'
         }}>
            <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ color: 'var(--ei-text-muted)', fontWeight: 700 }}>LOGS DE PROCESO</span>
               <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
               </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }} className="custom-scrollbar">
                  {logs.map((log, i) => (
                    <p key={i} style={{ 
                        margin: 0,
                        color: log.type === 'sys' ? '#4ade80' : 
                               log.type === 'ai' ? '#60a5fa' : 
                               log.type === 'error' ? '#f87171' : '#94a3b8' 
                    }}>
                        [{log.type === 'sys' ? 'SYSTEM' : log.type.toUpperCase()}] {log.msg}
                    </p>
                  ))}
                  <p style={{ color: 'var(--ei-text-muted)', margin: 0 }}>_</p>
            </div>
         </div>
      </div>

      {/* Quick Actions */}
      <p className="section-title-ei">Accesos Directos</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
        <ActionLink to={`/extractor/projects/${projectId}/review`}
          title="Revisión" desc="Valida los datos."
          icon={Inbox} count={stats.pending} />
        <ActionLink to={`/extractor/projects/${projectId}/schema`}
          title="Campos" desc="Configura IA."
          icon={Database} />
        <ActionLink to={`/extractor/projects/${projectId}/rules`}
          title="Reglas" desc="Validación."
          icon={ShieldAlert} />
        <ActionLink to={`/extractor/projects/${projectId}/exports`}
          title="Exportar" desc="Excel/JSON."
          icon={BarChart2} />
      </div>

      {/* Engine Info */}
      <p className="section-title-ei">Configuración del Motor</p>
      <div className="card-ei">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <InfoItem label="Proveedor"  value={project?.connector_llm?.toUpperCase()} />
          <InfoItem label="Modelo"     value={project?.llm_extract_model} />
          <InfoItem label="OCR"        value={project?.connector_ocr?.toUpperCase()} />
          <InfoItem label="Umbral"     value={`${Math.round((project?.confidence_threshold || 0.7) * 100)}%`} />
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ──

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue:   { bg: 'rgba(59,130,246,0.1)',  text: '#60a5fa' },
    yellow: { bg: 'rgba(245,158,11,0.1)',  text: '#fbbf24' },
    green:  { bg: 'rgba(34,197,94,0.1)',   text: '#4ade80' },
    red:    { bg: 'rgba(239,68,68,0.1)',   text: '#f87171' },
  };
  const c = colors[color];
  return (
    <div className="card-ei flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
           style={{ background: c.bg }}>
        <Icon size={20} style={{ color: c.text }} />
      </div>
      <div>
        <p className="text-lg font-bold" style={{ color: 'var(--ei-text-primary)' }}>{value}</p>
        <p className="text-xs" style={{ color: 'var(--ei-text-muted)' }}>{label}</p>
      </div>
    </div>
  );
};

const ActionLink = ({ to, title, desc, icon: Icon, count }) => (
  <Link to={to} className="card-ei flex items-center gap-4 hover:border-blue-500/40 transition-all group cursor-pointer">
    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0
                    group-hover:bg-blue-600 group-hover:text-white transition-all">
      <Icon size={20} className="text-blue-400 group-hover:text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--ei-text-primary)' }}>{title}</h3>
        {count > 0 && <span className="badge-ei badge-yellow-ei text-[10px]">{count}</span>}
      </div>
      <p className="text-xs mt-0.5" style={{ color: 'var(--ei-text-secondary)' }}>{desc}</p>
    </div>
    <ChevronRight size={16} style={{ color: 'var(--ei-text-muted)' }} />
  </Link>
);

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--ei-text-muted)' }}>{label}</p>
    <p className="text-sm font-medium" style={{ color: 'var(--ei-text-primary)' }}>{value || '—'}</p>
  </div>
);

export default ProjectDetail;
