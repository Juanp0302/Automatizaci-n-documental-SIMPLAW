import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Plus, Search, FolderOpen, ChevronRight, Layers } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ProjectWizard from '../../components/extractor/ProjectWizard';
import '../../styles/extractor.css';

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/extractor/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.client && p.client.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const active   = filtered.filter(p => p.status === 'active');
  const archived = filtered.filter(p => p.status === 'archived');

  return (
    <div className="animate-fade-in" style={{ padding: '40px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ei-text-primary)', margin: 0 }}>Proyectos</h1>
          <p style={{ fontSize: '0.875rem', marginTop: '4px', color: 'var(--ei-text-secondary)' }}>
            {projects.filter(p => p.status === 'active').length} proyectos activos
          </p>
        </div>
        <button onClick={() => setShowWizard(true)} className="btn-primary-ei">
          <Plus size={16} /> Nuevo proyecto
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ei-text-muted)' }} />
        <input
          className="input-ei"
          style={{ paddingLeft: '2.25rem' }}
          placeholder="Buscar proyectos..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {showWizard && (
        <ProjectWizard
          onClose={() => setShowWizard(false)}
          onCreated={(id) => { setShowWizard(false); navigate(`/extractor/projects/${id}`); }}
        />
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'ei-spin 1s linear infinite' }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--ei-text-muted)' }}>Cargando proyectos...</p>
        </div>
      ) : active.length === 0 && archived.length === 0 ? (
        <div className="card-ei" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', gap: '16px' }}>
          <Layers size={48} style={{ opacity: 0.2, color: 'var(--ei-text-secondary)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: 'var(--ei-text-primary)' }}>Sin proyectos</p>
            <p style={{ fontSize: '0.875rem', marginTop: '4px', color: 'var(--ei-text-secondary)' }}>
              Crea tu primer proyecto para comenzar
            </p>
          </div>
          <button className="btn-primary-ei" onClick={() => setShowWizard(true)}>
            <Plus size={16} /> Crear proyecto
          </button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <p className="section-title-ei">Activos</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {active.map(p => (
                  <ProjectCard key={p.id} project={p} onClick={() => navigate(`/extractor/projects/${p.id}`)} />
                ))}
              </div>
            </>
          )}

          {archived.length > 0 && (
            <>
              <p className="section-title-ei">Archivados</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {archived.map(p => (
                  <ProjectCard key={p.id} project={p} onClick={() => navigate(`/extractor/projects/${p.id}`)} archived />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

// ── Card ──
const ProjectCard = ({ project: p, onClick, archived }) => (
  <div
    className="card-ei"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', cursor: 'pointer', transition: 'border-color 150ms' }}
  >
    <div style={{
      width: '48px', height: '48px', borderRadius: '12px',
      background: 'rgba(59,130,246,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <FolderOpen size={22} style={{ color: '#60a5fa' }} />
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h3 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ei-text-primary)' }}>{p.name}</h3>
        {archived && <span className="badge-ei" style={{ background: 'var(--ei-bg-tertiary)', color: 'var(--ei-text-muted)' }}>Archivado</span>}
      </div>
      {p.client && <p style={{ fontSize: '0.75rem', marginTop: '2px', color: 'var(--ei-text-secondary)' }}>{p.client}</p>}
      {p.root_folder && (
        <p style={{ fontSize: '0.75rem', marginTop: '2px', color: 'var(--ei-text-muted)', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.root_folder}</p>
      )}
    </div>

    <ChevronRight size={16} style={{ color: 'var(--ei-text-muted)', flexShrink: 0 }} />
  </div>
);

export default ProjectList;

