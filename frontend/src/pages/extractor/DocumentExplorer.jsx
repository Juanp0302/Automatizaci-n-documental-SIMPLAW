import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, FileText, Download, 
  ExternalLink, Eye, ChevronRight,
  CheckCircle, AlertCircle, Clock, Trash2, RotateCw
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

const DocumentExplorer = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [docs, setDocs] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [docsRes, typesRes] = await Promise.all([
        api.get(`/extractor/projects/${projectId}/documents`),
        api.get(`/extractor/projects/${projectId}/types`),
      ]);
      setDocs(docsRes.data);
      setDocTypes(typesRes.data);
    } catch (err) {
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = api.defaults.baseURL;
      // Using direct link for reliable download
      const downloadUrl = `${baseUrl}/extractor/documents/${doc.id}/file?token=${token}`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', doc.file_name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Iniciando descarga de ${doc.file_name}`);
    } catch (err) {
      toast.error('Error al descargar el archivo');
    }
  };

  const handleReprocess = async (docId) => {
    if (!window.confirm('¿Volver a procesar este documento con la nueva configuración de IA?')) return;
    try {
      await api.post(`/extractor/documents/${docId}/reprocess`);
      toast.success('Documento enviado a re-procesamiento');
      fetchData();
    } catch (err) {
      toast.error('Error al solicitar re-procesamiento');
    }
  };

  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.doc_type_id?.toString() === filterType;
    const matchesStatus = filterStatus === 'all' || doc.review_status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ padding: '40px 48px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ei-text-primary)', margin: 0 }}>Explorador de Documentos</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--ei-text-secondary)', marginTop: '4px' }}>
            Visualiza y gestiona todos los documentos procesados en este proyecto.
        </p>
      </header>

      {/* Filters Bar */}
      <div className="card-ei" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ei-text-muted)' }} />
          <input 
            className="input-ei" 
            placeholder="Buscar por nombre de archivo..." 
            style={{ paddingLeft: '40px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
            className="input-ei" 
            style={{ width: '180px' }}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
        >
          <option value="all">Todos los tipos</option>
          {docTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <select 
            className="input-ei" 
            style={{ width: '180px' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente Revisión</option>
          <option value="approved">Aprobado</option>
          <option value="rejected">Rechazado</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-ei" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 800, color: 'var(--ei-text-muted)', textTransform: 'uppercase' }}>Documento</th>
              <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 800, color: 'var(--ei-text-muted)', textTransform: 'uppercase' }}>Tipo</th>
              <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 800, color: 'var(--ei-text-muted)', textTransform: 'uppercase' }}>Estado</th>
              <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 800, color: 'var(--ei-text-muted)', textTransform: 'uppercase' }}>Fecha</th>
              <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 800, color: 'var(--ei-text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length === 0 ? (
                <tr>
                    <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: 'var(--ei-text-muted)', fontSize: '0.875rem' }}>
                        No se encontraron documentos que coincidan con los filtros.
                    </td>
                </tr>
            ) : (
                filteredDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                                    <FileText size={16} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', margin: 0 }}>{doc.file_name}</p>
                                    <p style={{ fontSize: '10px', color: 'var(--ei-text-muted)', margin: 0 }}>{(doc.file_size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--ei-text-secondary)' }}>
                                {docTypes.find(t => t.id === doc.doc_type_id)?.name || 'Sin clasificar'}
                            </span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                            <StatusBadge status={doc.review_status} />
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--ei-text-muted)' }}>
                            {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button 
                                    onClick={() => navigate(`/extractor/projects/${projectId}/review`)}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors" 
                                    style={{ color: 'var(--ei-text-muted)' }}
                                    title="Ver Detalles / Revisar"
                                >
                                    <Eye size={16} />
                                </button>
                                <button 
                                    onClick={() => handleReprocess(doc.id)}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors" 
                                    style={{ color: 'var(--ei-text-muted)' }}
                                    title="Volver a Procesar con IA"
                                >
                                    <RotateCw size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDownload(doc)}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors" 
                                    style={{ color: 'var(--ei-text-muted)' }}
                                    title="Descargar"
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
    const config = {
        approved: { label: 'Aprobado', color: '#4ade80', bg: 'rgba(74,222,128,0.1)', icon: CheckCircle },
        rejected: { label: 'Rechazado', color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: AlertCircle },
        pending:  { label: 'Revisión', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', icon: Clock },
        none:     { label: 'Procesando', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', icon: Clock },
    };

    const s = config[status] || config.none;
    const Icon = s.icon;

    return (
        <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '4px 10px', 
            borderRadius: '20px', 
            fontSize: '10px', 
            fontWeight: 700, 
            background: s.bg, 
            color: s.color,
            border: `1px solid ${s.color}20`
        }}>
            <Icon size={12} />
            {s.label}
        </span>
    );
};

export default DocumentExplorer;
