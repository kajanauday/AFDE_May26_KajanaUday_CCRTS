import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="card p-10 text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm">
            You don't have permission to view this page.
          </p>
          <button
            className="btn-primary mt-5 w-full"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return children
}
