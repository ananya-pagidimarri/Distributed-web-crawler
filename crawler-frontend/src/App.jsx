import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuth from './hooks/useAuth';

// User Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import SearchEngine from './pages/SearchEngine';
import Workers from './pages/Workers';
import Queue from './pages/Queue';
import Analytics from './pages/Analytics';
import Logs from './pages/Logs';
import CrawlHistory from './pages/CrawlHistory';
import CrawlGraph from './pages/CrawlGraph';
import RobotsDashboard from './pages/RobotsDashboard';
import NotFound from './pages/NotFound';

// Wrapper that protects dashboard routes — checks for admin role
function ProtectedAdminRoute({ user, children }) {
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

// Wrapper that protects search functionality
function ProtectedUserRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const { user, loading, login, register, logout } = useAuth();

  React.useEffect(() => {
    const isDark = localStorage.getItem('crawlx_dark_mode') !== 'false';
    if (!isDark) {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 rounded-full border-3 border-t-cyan-400 border-r-cyan-400/20 border-b-cyan-400/20 border-l-cyan-400/20"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        maxToasts={3}
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#f8fafc',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            fontSize: '12px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
          },
          success: { iconTheme: { primary: '#22d3ee', secondary: '#0f172a' } },
          error: { iconTheme: { primary: '#f43f5e', secondary: '#0f172a' } }
        }}
      />

      <Routes>
        {/* --- Public / User Routes --- */}
        <Route path="/" element={<Home user={user} logout={logout} />} />
        <Route path="/about" element={<About />} />
        
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/register" element={<Register onRegister={register} />} />

        {/* --- Admin Routes --- */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLogin onLogin={login} />} />

        <Route path="/admin/dashboard" element={<ProtectedAdminRoute user={user}><Dashboard user={user} logout={logout} /></ProtectedAdminRoute>} />
        <Route path="/admin/indexed-pages" element={<ProtectedAdminRoute user={user}><SearchEngine user={user} logout={logout} /></ProtectedAdminRoute>} />
        <Route path="/admin/workers" element={<ProtectedAdminRoute user={user}><Workers user={user} logout={logout} /></ProtectedAdminRoute>} />
        <Route path="/admin/queue" element={<ProtectedAdminRoute user={user}><Queue user={user} logout={logout} /></ProtectedAdminRoute>} />
        <Route path="/admin/history" element={<ProtectedAdminRoute user={user}><CrawlHistory user={user} logout={logout} /></ProtectedAdminRoute>} />
        <Route path="/admin/graph" element={<ProtectedAdminRoute user={user}><CrawlGraph user={user} logout={logout} /></ProtectedAdminRoute>} />
        <Route path="/admin/analytics" element={<ProtectedAdminRoute user={user}><Analytics user={user} logout={logout} /></ProtectedAdminRoute>} />
        <Route path="/admin/logs" element={<ProtectedAdminRoute user={user}><Logs user={user} logout={logout} /></ProtectedAdminRoute>} />
        <Route path="/admin/robots" element={<ProtectedAdminRoute user={user}><RobotsDashboard user={user} logout={logout} /></ProtectedAdminRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;