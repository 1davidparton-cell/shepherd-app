import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/auth/LoginPage';
import AuthCallback from './pages/auth/AuthCallback';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminChat from './pages/admin/AdminChat';
import AdminHomework from './pages/admin/AdminHomework';
import AdminResponses from './pages/admin/AdminResponses';
import PortalLayout from './pages/portal/PortalLayout';
import PortalHome from './pages/portal/PortalHome';
import PortalChat from './pages/portal/PortalChat';
import PortalHomework from './pages/portal/PortalHomework';
import PortalScripture from './pages/portal/PortalScripture';
import PortalWord from './pages/portal/PortalWord';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-shepherd-navy">
        <div className="text-shepherd-gold font-serif text-2xl">Shepherd</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireDisciple({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.archivedAt) return <Navigate to="/login?error=archived" replace />;
  if (!user.counselorId) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function RoleRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'counselor' || user._count.disciples > 0) return <Navigate to="/admin" replace />;
  if (user.counselorId) return <Navigate to="/portal" replace />;
  return <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/" element={<ProtectedRoute><RoleRouter /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="chat" element={<AdminChat />} />
          <Route path="homework" element={<AdminHomework />} />
          <Route path="responses" element={<AdminResponses />} />
        </Route>

        <Route path="/portal" element={<RequireDisciple><PortalLayout /></RequireDisciple>}>
          <Route index element={<PortalHome />} />
          <Route path="chat" element={<PortalChat />} />
          <Route path="homework" element={<PortalHomework />} />
          <Route path="scripture" element={<PortalScripture />} />
          <Route path="word" element={<PortalWord />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
