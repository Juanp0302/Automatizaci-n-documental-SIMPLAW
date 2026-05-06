import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { 
  CheckCircle, XCircle, AlertTriangle, Loader2, 
  FileText, Search, ChevronRight, Info, ExternalLink,
  Save, Trash2, ArrowLeft, ArrowRight, RotateCw
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import '../../styles/extractor.css';

const ReviewInbox = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [fileUrl, setFileUrl] = useState(null);

  useEffect(() => {
    fetchInitialData();
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [projectId]);

  const fetchInitialData = async () => {
    try {
      const [docsRes, typesRes] = await Promise.all([
        api.get(`/extractor/projects/${projectId}/documents`),
        api.get(`/extractor/projects/${projectId}/types`)
      ]);
      
      // SOLO mostramos los que están marcados como 'pending' (por debajo del umbral)
      const pending = docsRes.data.filter(d => 
        d.review_status === 'pending' && d.status === 'completed'
      );
      setDocs(pending);
      setDocTypes(typesRes.data);
      
      if (pending.length > 0) {
        handleSelectDoc(pending[0]);
      }
    } catch (err) {
      console.error('Error fetching review data:', err);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoc = async (doc) => {
    setSelectedDoc(doc);
    const vals = {};
    doc.field_values.forEach(fv => {
      vals[fv.field_name] = fv.normalized_value || fv.raw_value || '';
    });
    setEditValues(vals);

    // Cargar archivo como blob con Token
    try {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      const res = await api.get(`/extractor/documents/${doc.id}/file`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(res.data);
      setFileUrl(url);
    } catch (err) {
      console.error('Error loading file blob:', err);
      setFileUrl(null);
    }
  };

  const handleApprove = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    try {
      await api.put(`/extractor/documents/${selectedDoc.id}/review`, { status: 'approved' });
      toast.success('Documento aprobado');
      const remaining = docs.filter(d => d.id !== selectedDoc.id);
      setDocs(remaining);
      if (remaining.length > 0) {
        handleSelectDoc(remaining[0]);
      } else {
        setSelectedDoc(null);
      }
    } catch (err) {
      toast.error('Error al aprobar');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    try {
      await api.put(`/extractor/documents/${selectedDoc.id}/review`, { status: 'rejected' });
      toast.success('Documento descartado');
      const remaining = docs.filter(d => d.id !== selectedDoc.id);
      setDocs(remaining);
      if (remaining.length > 0) {
        handleSelectDoc(remaining[0]);
      } else {
        setSelectedDoc(null);
      }
    } catch (err) {
      toast.error('Error al descartar');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    const currentIndex = docs.findIndex(d => d.id === selectedDoc?.id);
    if (currentIndex < docs.length - 1) {
      handleSelectDoc(docs[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    const currentIndex = docs.findIndex(d => d.id === selectedDoc?.id);
    if (currentIndex > 0) {
      handleSelectDoc(docs[currentIndex - 1]);
    }
  };

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ei-bg-primary)' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'ei-spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--ei-bg-primary)' }}>
      {/* Left Pane: Document List */}
      <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30,41,59,0.1)' }}>
        <div style={{ height: '64px', padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.1)' }}>
          <div>
            <h2 className="section-title-ei" style={{ marginBottom: 0 }}>Bandeja de Revisión</h2>
            <p style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase' }}>{docs.length} Pendientes</p>
          </div>
          <AlertTriangle size={16} style={{ color: 'rgba(234,179,8,0.5)' }} />
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
          {docs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', textAlign: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={32} style={{ color: '#22c55e' }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--ei-text-muted)', fontWeight: 500, lineHeight: 1.5 }}>¡Sin pendientes! Todos los documentos han sido revisados.</p>
            </div>
          ) : (
            docs.map(doc => (
              <div
                key={doc.id}
                onClick={() => handleSelectDoc(doc)}
                style={{
                  width: '100%', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer',
                  position: 'relative', transition: 'all 150ms',
                  background: selectedDoc?.id === doc.id ? 'rgba(59,130,246,0.1)' : 'transparent'
                }}
              >
                {selectedDoc?.id === doc.id && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#3b82f6' }} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: selectedDoc?.id === doc.id ? '#60a5fa' : 'var(--ei-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.file_name}
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: (doc.classification_confidence > 0.8) ? '#22c55e' : '#eab308' }}>
                      {Math.round(doc.classification_confidence * 100)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ei-text-muted)', fontSize: '9px', fontWeight: 800, padding: '2px 4px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      {doc.doc_type_name || 'Desconocido'}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--ei-text-muted)' }}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Middle Pane: Viewer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--ei-bg-primary)', overflow: 'hidden' }}>
        {selectedDoc ? (
          <>
            <div style={{ height: '48px', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <FileText size={16} style={{ color: '#3b82f6' }} />
                 <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ei-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visualizador de Documento</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <button onClick={handlePrev} style={{ background: 'none', border: 'none', color: 'var(--ei-text-muted)', cursor: 'pointer', padding: '4px' }}>
                     <ArrowLeft size={16} />
                   </button>
                   <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ei-text-muted)', minWidth: '40px', textAlign: 'center' }}>
                     {docs.findIndex(d => d.id === selectedDoc.id) + 1} / {docs.length}
                   </span>
                   <button onClick={handleNext} style={{ background: 'none', border: 'none', color: 'var(--ei-text-muted)', cursor: 'pointer', padding: '4px' }}>
                     <ArrowRight size={16} />
                   </button>
                </div>
                <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />
                <button 
                  onClick={async () => {
                    if (window.confirm('¿Estás seguro de que deseas volver a procesar este documento? Se perderán los cambios manuales.')) {
                      try {
                        await api.post(`/extractor/documents/${selectedDoc.id}/reprocess`);
                        toast.success('Documento enviado a re-procesamiento');
                        fetchInitialData();
                      } catch (err) {
                        toast.error('Error al solicitar re-procesamiento');
                      }
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--ei-text-muted)', cursor: 'pointer' }}
                  title="Volver a Procesar con IA"
                >
                   <RotateCw size={16} />
                </button>
                <button onClick={() => window.open(`${api.defaults.baseURL}/extractor/documents/${selectedDoc.id}/file?token=${localStorage.getItem('token')}`, '_blank')} style={{ background: 'none', border: 'none', color: 'var(--ei-text-muted)', cursor: 'pointer' }}>
                   <ExternalLink size={16} />
                </button>
              </div>
            </div>
            {fileUrl ? (
              <iframe 
                src={fileUrl}
                style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
                title="Document Preview"
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', color: 'var(--ei-text-muted)', fontSize: '12px' }}>
                 Cargando visor de documento...
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', opacity: 0.3 }}>
             <FileText size={80} />
             <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Selecciona un documento para revisar</p>
          </div>
        )}
      </div>

      {/* Right Pane: Validation Panel */}
      {selectedDoc && (
        <div style={{ width: '420px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30,41,59,0.05)' }}>
          <div style={{ height: '64px', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.1)' }}>
            <div style={{ minWidth: 0, flex: 1, marginRight: '16px' }}>
              <h2 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ei-text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedDoc.file_name}</h2>
              <p style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Revisión de Datos</p>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="custom-scrollbar">
            {/* Classification Section */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 className="section-title-ei" style={{ fontSize: '10px', margin: 0 }}>Tipo de Documento</h3>
                <div style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                   {Math.round(selectedDoc.classification_confidence * 100)}% Confianza
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {docTypes.map(type => (
                  <button
                    key={type.id}
                    style={{
                      padding: '10px', borderRadius: '8px', border: '1px solid', textAlign: 'left', cursor: 'pointer', transition: 'all 150ms',
                      background: selectedDoc.doc_type_id === type.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                      borderColor: selectedDoc.doc_type_id === type.id ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                      color: selectedDoc.doc_type_id === type.id ? '#fff' : 'var(--ei-text-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: type.color }} />
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>{type.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fields Section */}
            <div>
              <h3 className="section-title-ei" style={{ fontSize: '10px', marginBottom: '16px' }}>Información Extraída</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {selectedDoc.field_values.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: '11px', color: 'var(--ei-text-muted)', fontStyle: 'italic', margin: 0 }}>No hay campos disponibles para este tipo.</p>
                  </div>
                ) : (
                  selectedDoc.field_values.map(fv => (
                    <div key={fv.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ei-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          {fv.field_label || fv.field_name}
                        </label>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: (fv.confidence > 0.8) ? '#22c55e' : '#eab308' }}>
                          {Math.round(fv.confidence * 100)}%
                        </span>
                      </div>
                      <input 
                        className="input-ei"
                        style={{ fontSize: '12px', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}
                        value={editValues[fv.field_name] || ''}
                        onChange={(e) => setEditValues({...editValues, [fv.field_name]: e.target.value})}
                      />
                      {fv.source_text && (
                        <div style={{ padding: '8px 12px', background: 'rgba(59,130,246,0.03)', borderLeft: '2px solid rgba(59,130,246,0.3)', borderRadius: '0 4px 4px 0' }}>
                          <p style={{ fontSize: '10px', color: 'var(--ei-text-muted)', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                             "{fv.source_text}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.1)' }}>
            <button 
              onClick={handleReject}
              disabled={saving}
              style={{ 
                background: 'none', border: 'none', color: '#f87171', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px'
              }}
            >
               <Trash2 size={14} /> Descartar
            </button>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: '4px', marginRight: '16px' }}>
                  <button onClick={handlePrev} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <button onClick={handleNext} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>
                    <ArrowRight size={16} />
                  </button>
               </div>
               
               <button 
                 onClick={handleApprove}
                 disabled={saving}
                 className="btn-primary-ei"
                 style={{ padding: '10px 24px', height: '40px', fontSize: '12px' }}
               >
                 {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                 <span>Finalizar Revisión</span>
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewInbox;

