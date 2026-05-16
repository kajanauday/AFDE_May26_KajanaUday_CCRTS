import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'
import {
  MessageSquare,
  Clock,
  Activity,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import { StatusBadge, PriorityBadge } from '../components/ComplaintBadge'
import api from '../api/axios'

const STATUS_COLORS = {
  open: '#3B82F6',
  assigned: '#8B5CF6',
  in_progress: '#F97316',
  pending_customer_response: '#EAB308',
  escalated: '#EF4444',
  resolved: '#22C55E',
  closed: '#94A3B8',
}

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#F97316', '#EAB308', '#EF4444', '#22C55E', '#94A3B8']

function SLADeadline({ date }) {
  if (!date) return <span className="text-gray-400">—</span>
  const deadline = new Date(date)
  const now = new Date()
  const diff = deadline - now
  const twoHours = 2 * 60 * 60 * 1000

  if (diff < 0) {
    return (
      <span className="text-red-600 font-semibold text-xs">
        Breached {deadline.toLocaleDateString()}
      </span>
    )
  }
  if (diff < twoHours) {
    return (
      <span className="text-yellow-600 font-semibold text-xs">
        {deadline.toLocaleDateString()} ⚠
      </span>
    )
  }
  return (
    <span className="text-gray-600 text-xs">{deadline.toLocaleDateString()}</span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/api/dashboard/stats')
      return res.data
    },
  })

  const stats = data?.stats || data || {}
  const categoryData = data?.by_category || data?.complaints_by_category || []
  const statusData = data?.by_status || data?.complaints_by_status || []
  const monthlyData = data?.monthly_trend || data?.monthly || []
  const recentComplaints = data?.recent_complaints || data?.recent || []

  const statCards = [
    {
      label: 'Total Complaints',
      value: stats.total || 0,
      icon: MessageSquare,
      color: 'blue',
    },
    {
      label: 'Open',
      value: stats.open || 0,
      icon: MessageSquare,
      color: 'blue',
    },
    {
      label: 'In Progress',
      value: stats.in_progress || 0,
      icon: Activity,
      color: 'orange',
    },
    {
      label: 'Resolved',
      value: stats.resolved || 0,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Escalated',
      value: stats.escalated || 0,
      icon: AlertTriangle,
      color: 'red',
    },
    {
      label: 'SLA Breaches',
      value: stats.sla_breached || 0,
      icon: ShieldAlert,
      color: 'red',
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <ShieldAlert className="h-12 w-12 text-red-400" />
        <p className="text-gray-600 font-medium">Failed to load dashboard data</p>
        <button className="btn-primary" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of complaint activity and system health
          </p>
        </div>
        <button className="btn-secondary gap-2 text-sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: by Category */}
        <div className="card col-span-1 lg:col-span-2">
          <div className="card-header">
            <h2 className="font-semibold text-gray-800">Complaints by Category</h2>
          </div>
          <div className="card-body">
            {categoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <MessageSquare className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No category data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                    cursor={{ fill: '#EFF6FF' }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart: by Status */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-800">By Status</h2>
          </div>
          <div className="card-body">
            {statusData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Activity className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No status data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="45%"
                    outerRadius={75}
                    innerRadius={45}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs text-gray-600">
                        {value.replace(/_/g, ' ')}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Line Chart: Monthly Trend */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-800">Monthly Complaint Trend</h2>
          <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
        </div>
        <div className="card-body">
          {monthlyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Clock className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">No trend data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Recent Complaints</h2>
          <button
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            onClick={() => navigate('/complaints')}
          >
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          {recentComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
              <MessageSquare className="h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">No complaints yet</p>
              <p className="text-xs">Complaints will appear here once created</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left table-header">Complaint #</th>
                  <th className="px-5 py-3 text-left table-header">Title</th>
                  <th className="px-5 py-3 text-left table-header">Category</th>
                  <th className="px-5 py-3 text-left table-header">Priority</th>
                  <th className="px-5 py-3 text-left table-header">Status</th>
                  <th className="px-5 py-3 text-left table-header">SLA</th>
                  <th className="px-5 py-3 text-left table-header">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((c) => (
                  <tr
                    key={c.id}
                    className="table-row"
                    onClick={() => navigate(`/complaints/${c.id}`)}
                  >
                    <td className="px-5 py-3 font-mono text-blue-600 font-medium text-xs">
                      #{c.complaint_number || c.id}
                    </td>
                    <td className="px-5 py-3 text-gray-800 max-w-xs truncate font-medium">
                      {c.title}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{c.category}</td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3">
                      <SLADeadline date={c.sla_deadline} />
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
