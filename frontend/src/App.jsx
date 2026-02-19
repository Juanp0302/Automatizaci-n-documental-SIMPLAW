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
import TemplateConfig from './pages/TemplateConfig'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

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

            <Route element={<ProtectedRoute adminOnly={true} />}>
                <Route element={<Layout />}>
                    <Route path="/users" element={<Users />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
