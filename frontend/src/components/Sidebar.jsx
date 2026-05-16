import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  Inbox,
  Users,
  BarChart2,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  Tags,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ROLE_NAV = {
  customer: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/complaints', icon: MessageSquare, label: 'My Complaints' },
    { to: '/complaints/new', icon: PlusCircle, label: 'New Complaint' },
  ],
  support_agent: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/queue', icon: Inbox, label: 'My Queue' },
    { to: '/complaints', icon: MessageSquare, label: 'All Complaints' },
  ],
  supervisor: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/complaints', icon: MessageSquare, label: 'All Complaints' },
    { to: '/reports', icon: BarChart2, label: 'Reports' },
    { to: '/escalations', icon: AlertTriangle, label: 'Escalations' },
  ],
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/complaints', icon: MessageSquare, label: 'All Complaints' },
    { to: '/complaints/new', icon: PlusCircle, label: 'New Complaint' },
    { to: '/users', icon: Users, label: 'User Management' },
    { to: '/reports', icon: BarChart2, label: 'Reports' },
  ],
  quality_team: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/reports', icon: BarChart2, label: 'Reports' },
    { to: '/complaints', icon: MessageSquare, label: 'All Complaints' },
  ],
}

const ROLE_LABELS = {
  admin: 'Administrator',
  supervisor: 'Supervisor',
  support_agent: 'Support Agent',
  quality_team: 'Quality Team',
  customer: 'Customer',
}

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Sidebar({ collapsed }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = ROLE_NAV[user?.role] || ROLE_NAV.customer

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-slate-800 flex flex-col z-40 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 flex-shrink-0 shadow-lg">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-white font-bold text-lg leading-none">CCRTS</div>
            <div className="text-slate-400 text-xs mt-0.5 truncate">Complaint Tracking</div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto scrollbar-thin space-y-0.5">
        {!collapsed && (
          <div className="px-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Navigation
          </div>
        )}
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4.5 w-4.5 flex-shrink-0" size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="border-t border-white/10 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
              {getInitials(user?.full_name || user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate">
                {user?.full_name || user?.name || 'User'}
              </div>
              <div className="text-slate-400 text-xs truncate">
                {ROLE_LABELS[user?.role] || user?.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {getInitials(user?.full_name || user?.name)}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
