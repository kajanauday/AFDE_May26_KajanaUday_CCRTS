import React from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ComplaintList from './pages/ComplaintList'
import ComplaintCreate from './pages/ComplaintCreate'
import ComplaintDetail from './pages/ComplaintDetail'
import AgentQueue from './pages/AgentQueue'
import UserManagement from './pages/UserManagement'
import Reports from './pages/Reports'

// Auth guard — renders Outlet if authenticated, else redirects to login
function RequireAuth() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400 font-medium">Initializing CCRTS...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

// Role guard — renders Outlet if user has required role, else shows access denied
function RequireRole({ roles }) {
  const { user } = useAuth()

  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm mb-5">
            You don&apos;t have permission to view this page.
          </p>
          <button
            className="btn-primary w-full"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}

// Escalation page — wraps ComplaintList
function EscalationPage() {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-red-100 rounded-xl">
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="page-title">Escalated Complaints</h1>
          <p className="text-sm text-gray-500">Complaints requiring immediate attention</p>
        </div>
      </div>
      <ComplaintList />
    </div>
  )
}

// 404 page
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-8xl font-black text-gray-200">404</div>
      <h2 className="text-xl font-bold text-gray-700">Page Not Found</h2>
      <p className="text-gray-500 text-sm">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <a href="/dashboard" className="btn-primary mt-2">
        Go to Dashboard
      </a>
    </div>
  )
}

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400 font-medium">Initializing CCRTS...</span>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Routes: RequireAuth guards all, Layout provides shell */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          {/* Dashboard — all authenticated roles */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Complaints — all authenticated roles */}
          <Route path="/complaints" element={<ComplaintList />} />
          <Route path="/complaints/:id" element={<ComplaintDetail />} />

          {/* New complaint — customer, admin, supervisor */}
          <Route element={<RequireRole roles={['customer', 'admin', 'supervisor']} />}>
            <Route path="/complaints/new" element={<ComplaintCreate />} />
          </Route>

          {/* Agent Queue — support agents only */}
          <Route element={<RequireRole roles={['support_agent']} />}>
            <Route path="/queue" element={<AgentQueue />} />
          </Route>

          {/* Escalations — admin, supervisor */}
          <Route element={<RequireRole roles={['admin', 'supervisor']} />}>
            <Route path="/escalations" element={<EscalationPage />} />
          </Route>

          {/* Reports — admin, supervisor, quality_team */}
          <Route element={<RequireRole roles={['admin', 'supervisor', 'quality_team']} />}>
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* User Management — admin only */}
          <Route element={<RequireRole roles={['admin']} />}>
            <Route path="/users" element={<UserManagement />} />
          </Route>

          {/* 404 inside app layout */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
