import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Download, FileSpreadsheet, FileJson, 
  CheckCircle, Filter, AlertCircle, Loader2
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

const ExportResults = () => {
  const { id: projectId } = useParams();
  const toast = useToast();
  const [stats, setStats] = useState({ approved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState('excel');
  const [filter, setFilter] = useState('approved'); // approved, all

  useEffect(() => {
    fetchStats();
  }, [projectId]);

  const fetchStats = async () => {
    try {
      const res = await api.get(`/extractor/projects/${projectId}/documents`);
      const total = res.data.length;
      const approved = res.data.filter(d => d.review_status === 'approved').length;
      setStats({ total, approved });
    } catch {
      toast.error('Error al cargar estadísticas de exportación');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    
    try {
      console.log(`Starting native download for ${format} (Project: ${projectId})...`);
      
      const token = localStorage.getItem('token');
      // Construct the direct download URL
      const baseUrl = api.defaults.baseURL;
      const downloadUrl = `${baseUrl}/extractor/projects/${projectId}/download?format=${format}&filter=${filter}&token=${token}`;
      
      // We use a temporary link to trigger the browser's native download manager
      // This is much more reliable than Blob for binary files across different browsers
      const link = document.createElement('a');
      link.href = downloadUrl;
      // The filename is suggested by the server via Content-Disposition
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Generando reporte... La descarga comenzará en breve.');
      
      // Simulate a small delay for the "Generating" state
      setTimeout(() => setExporting(false), 2000);
    } catch (err) {
      console.error('Export trigger error:', err);
      toast.error('Error al iniciar la descarga');
      setExporting(false);
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
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ei-text-primary)', margin: 0 }}>Exportar Resultados</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--ei-text-secondary)', marginTop: '4px' }}>
            Genera reportes detallados con la información extraída de tus documentos.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
        <div className="card-ei" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>Configuración de Reporte</h3>
            
            <div style={{ marginBottom: '32px' }}>
                <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ei-text-muted)', textTransform: 'uppercase', marginBottom: '16px', display: 'block' }}>Formato de Salida</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <FormatOption 
                        active={format === 'excel'} 
                        onClick={() => setFormat('excel')}
                        icon={FileSpreadsheet}
                        label="Excel (.xlsx)"
                        desc="Ideal para análisis y tablas dinámicas."
                    />
                    <FormatOption 
                        active={format === 'csv'} 
                        onClick={() => setFormat('csv')}
                        icon={Download}
                        label="CSV"
                        desc="Formato estándar para bases de datos."
                    />
                    <FormatOption 
                        active={format === 'json'} 
                        onClick={() => setFormat('json')}
                        icon={FileJson}
                        label="JSON"
                        desc="Perfecto para integraciones de sistemas."
                    />
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ei-text-muted)', textTransform: 'uppercase', marginBottom: '16px', display: 'block' }}>Criterio de Selección</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <FilterButton 
                        active={filter === 'approved'} 
                        onClick={() => setFilter('approved')}
                        label="Solo Aprobados"
                        count={stats.approved}
                    />
                    <FilterButton 
                        active={filter === 'all'} 
                        onClick={() => setFilter('all')}
                        label="Todos los Procesados"
                        count={stats.total}
                    />
                </div>
            </div>

            <button 
                onClick={handleExport}
                disabled={exporting || (filter === 'approved' && stats.approved === 0)}
                className="btn-primary-ei" 
                style={{ width: '100%', height: '52px', fontSize: '1rem', justifyContent: 'center' }}
            >
                {exporting ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                {exporting ? 'Generando Reporte...' : 'Descargar Reporte'}
            </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card-ei" style={{ padding: '24px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '8px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', color: '#60a5fa' }}>
                        <CheckCircle size={20} />
                    </div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', margin: 0 }}>Listo para Exportar</h4>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--ei-text-secondary)', lineHeight: 1.6 }}>
                    Se han validado <strong>{stats.approved}</strong> documentos de un total de {stats.total}. 
                    Recuerda que los documentos pendientes de revisión no se incluirán si seleccionas "Solo Aprobados".
                </p>
            </div>

            <div className="card-ei" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--ei-text-muted)' }}>
                        <AlertCircle size={20} />
                    </div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', margin: 0 }}>Información</h4>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--ei-text-muted)', lineHeight: 1.6 }}>
                    El archivo generado contendrá todos los campos definidos en tu esquema, incluyendo los metadatos de clasificación y confianza.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

const FormatOption = ({ active, onClick, icon: Icon, label, desc }) => (
    <div 
        onClick={onClick}
        style={{ 
            padding: '20px', 
            borderRadius: '16px', 
            background: active ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${active ? '#3b82f6' : 'rgba(255,255,255,0.05)'}`,
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center'
        }}
    >
        <Icon size={24} style={{ color: active ? '#60a5fa' : 'var(--ei-text-muted)', marginBottom: '12px' }} />
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: active ? '#fff' : 'var(--ei-text-secondary)', marginBottom: '4px' }}>{label}</p>
        <p style={{ fontSize: '0.625rem', color: 'var(--ei-text-muted)', lineHeight: 1.4 }}>{desc}</p>
    </div>
);

const FilterButton = ({ active, onClick, label, count }) => (
    <div 
        onClick={onClick}
        style={{ 
            flex: 1,
            padding: '12px 20px',
            borderRadius: '12px',
            background: active ? '#3b82f6' : 'rgba(255,255,255,0.05)',
            color: active ? '#fff' : 'var(--ei-text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8125rem',
            fontWeight: 600
        }}
    >
        <span>{label}</span>
        <span style={{ 
            padding: '2px 8px', 
            borderRadius: '4px', 
            background: active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            fontSize: '10px'
        }}>
            {count}
        </span>
    </div>
);

export default ExportResults;
