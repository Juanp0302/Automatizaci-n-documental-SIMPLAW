import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Templates from './pages/Templates'
import Documents from './pages/Documents'
import NewDocument from './pages/NewDocument'
import Profile from './pages/Profile'
import Users from './pages/Users'
import Statistics from './pages/Statistics'
import TemplateConfig from './pages/TemplateConfig'
import ProjectList from './pages/extractor/ProjectList'
import ProjectDetail from './pages/extractor/ProjectDetail'
import SchemaEditor from './pages/extractor/SchemaEditor'
import ReviewInbox from './pages/extractor/ReviewInbox'
import Settings from './pages/extractor/Settings'
import RulesEditor from './pages/extractor/RulesEditor'
import DocumentExplorer from './pages/extractor/DocumentExplorer'
import ExportResults from './pages/extractor/ExportResults'

// Components
import Layout from './components/Layout'
import ExtractorLayout from './components/extractor/ExtractorLayout'
import ProtectedRoute from './components/ProtectedRoute'

// Placeholder for pages not yet implemented
const PlaceholderPage = ({ title, desc }) => (
    <div style={{ padding: '40px 48px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ei-text-primary)', marginBottom: '8px' }}>{title}</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--ei-text-secondary)', marginBottom: '40px' }}>{desc}</p>
        <div style={{
            background: 'var(--ei-bg-secondary)', border: '1px dashed var(--ei-border)',
            borderRadius: '12px', padding: '80px 40px', textAlign: 'center',
        }}>
            <p style={{ color: 'var(--ei-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
                🚧 En construcción — Próximamente
            </p>
        </div>
    </div>
)

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            {/* Standard Automation Layout */}
            <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/templates/:id/config" element={<TemplateConfig />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/documents/new" element={<NewDocument />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>
            </Route>

            {/* Admin Layout */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
                <Route element={<Layout />}>
                    <Route path="/users" element={<Users />} />
                    <Route path="/statistics" element={<Statistics />} />
                </Route>
            </Route>

            {/* Extractor Module (Dedicated Layout) */}
            <Route element={<ProtectedRoute />}>
                <Route path="/extractor" element={<ExtractorLayout />}>
                    <Route index element={<ProjectList />} />
                    <Route path="projects/:id" element={<ProjectDetail />} />
                    <Route path="projects/:id/schema" element={<SchemaEditor />} />
                    <Route path="projects/:id/review" element={<ReviewInbox />} />
                    <Route path="projects/:id/rules" element={<RulesEditor />} />
                    <Route path="projects/:id/documents" element={<DocumentExplorer />} />
                    <Route path="projects/:id/exports" element={<ExportResults />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
