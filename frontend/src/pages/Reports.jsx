import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  BarChart2,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Star,
} from 'lucide-react'
import api from '../api/axios'

const PRIORITY_COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
}

const PALETTE = ['#3B82F6', '#8B5CF6', '#F97316', '#EAB308', '#EF4444', '#22C55E', '#94A3B8']

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className={`card p-5 flex items-center gap-4`}>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
        <div className="text-sm text-gray-500 font-medium">{label}</div>
      </div>
    </div>
  )
}

export default function Reports() {
  const { data: statsData, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/api/dashboard/stats')
      return res.data
    },
  })

  const { data: agentData, isLoading: agentLoading, isError: agentError, refetch: refetchAgent } = useQuery({
    queryKey: ['agent-performance'],
    queryFn: async () => {
      const res = await api.get('/api/dashboard/agent-performance')
      return res.data
    },
  })

  const stats = statsData?.stats || statsData || {}
  const monthlyData = statsData?.monthly_trend || statsData?.monthly || []
  const byPriority = statsData?.by_priority || []
  const agents = agentData?.agents || agentData || []

  const isLoading = statsLoading || agentLoading
  const isError = statsError || agentError

  const refetch = () => { refetchStats(); refetchAgent() }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading reports...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-gray-600 font-medium">Failed to load report data</p>
        <button className="btn-primary" onClick={refetch}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-blue-500" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">System-wide performance and complaint analytics</p>
        </div>
        <button className="btn-secondary text-sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Complaints" value={stats.total || 0} icon={BarChart2} color="bg-blue-500" />
        <SummaryCard label="Resolved" value={stats.resolved || 0} icon={CheckCircle} color="bg-green-500" />
        <SummaryCard label="SLA Breaches" value={stats.sla_breached || 0} icon={AlertTriangle} color="bg-red-500" />
        <SummaryCard label="Avg Resolution (h)" value={stats.avg_resolution_hours ? stats.avg_resolution_hours.toFixed(1) : '—'} icon={Clock} color="bg-orange-500" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Monthly Complaint Volume
            </h2>
          </div>
          <div className="card-body">
            {monthlyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-44 text-gray-400">
                <TrendingUp className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No trend data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Resolution by Priority */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-800">Resolution Rate by Priority</h2>
          </div>
          <div className="card-body">
            {byPriority.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-44 text-gray-400">
                <BarChart2 className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No priority data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byPriority} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="priority" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Bar dataKey="total" name="Total" fill="#BFDBFE" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="resolved" name="Resolved" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {byPriority.map((entry, idx) => (
                      <Cell key={idx} fill={PRIORITY_COLORS[entry.priority] || PALETTE[idx % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Agent Performance Table */}
      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Agent Performance
          </h2>
        </div>
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
            <Users className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium text-gray-500">No agent data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left table-header">Agent</th>
                  <th className="px-5 py-3 text-right table-header">Total Assigned</th>
                  <th className="px-5 py-3 text-right table-header">Resolved</th>
                  <th className="px-5 py-3 text-right table-header">Pending</th>
                  <th className="px-5 py-3 text-right table-header">Avg Resolution (h)</th>
                  <th className="px-5 py-3 text-right table-header">Avg Rating</th>
                  <th className="px-5 py-3 text-right table-header">Resolution Rate</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent, idx) => {
                  const rate =
                    agent.total_assigned > 0
                      ? Math.round((agent.resolved / agent.total_assigned) * 100)
                      : 0
                  return (
                    <tr key={agent.id || idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {(agent.name || agent.agent_name || '?').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">
                            {agent.name || agent.agent_name || agent.full_name || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700 font-semibold">
                        {agent.total_assigned ?? 0}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-green-600 font-semibold">{agent.resolved ?? 0}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-orange-600 font-semibold">{agent.pending ?? 0}</span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        {agent.avg_resolution_hours ? `${agent.avg_resolution_hours.toFixed(1)}h` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {agent.avg_rating ? (
                          <div className="flex items-center justify-end gap-1">
                            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="font-semibold text-gray-700">{agent.avg_rating.toFixed(1)}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-8 text-right">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
