import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Inbox,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { StatusBadge, PriorityBadge } from '../components/ComplaintBadge'
import api from '../api/axios'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending_customer_response', label: 'Pending Response' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const PAGE_SIZE = 15

function SLACell({ date }) {
  if (!date) return <span className="text-gray-400 text-xs">—</span>
  const deadline = new Date(date)
  const now = new Date()
  const diff = deadline - now
  if (diff < 0)
    return (
      <div className="flex items-center gap-1 text-red-600">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold">{deadline.toLocaleDateString()}</span>
      </div>
    )
  if (diff < 2 * 60 * 60 * 1000)
    return <span className="text-yellow-600 text-xs font-semibold">{deadline.toLocaleDateString()} ⚠</span>
  return <span className="text-gray-500 text-xs">{deadline.toLocaleDateString()}</span>
}

export default function AgentQueue() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState(null)
  const [statusMap, setStatusMap] = useState({})

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['agent-queue', page],
    queryFn: async () => {
      const params = new URLSearchParams({ page, page_size: PAGE_SIZE, assigned_to_me: true })
      const res = await api.get(`/api/complaints?${params.toString()}`)
      return res.data
    },
  })

  const complaints = data?.complaints || data?.items || data || []
  const total = data?.total || complaints.length
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      api.patch(`/api/complaints/${id}/status`, { status }),
    onSuccess: (_, vars) => {
      toast.success('Status updated!')
      queryClient.invalidateQueries({ queryKey: ['agent-queue'] })
      setUpdatingId(null)
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Update failed')
      setUpdatingId(null)
    },
  })

  const handleStatusChange = (id, status) => {
    setStatusMap((prev) => ({ ...prev, [id]: status }))
  }

  const handleUpdate = (id) => {
    const status = statusMap[id]
    if (!status) return
    setUpdatingId(id)
    updateStatusMutation.mutate({ id, status })
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Inbox className="h-6 w-6 text-blue-500" />
            My Queue
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Complaints assigned to you — {total} total
          </p>
        </div>
        <button className="btn-secondary text-sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Assigned', value: total, color: 'bg-blue-50 text-blue-700' },
          {
            label: 'SLA Breached',
            value: complaints.filter((c) => c.sla_deadline && new Date(c.sla_deadline) < new Date()).length,
            color: 'bg-red-50 text-red-700',
          },
          {
            label: 'In Progress',
            value: complaints.filter((c) => c.status === 'in_progress').length,
            color: 'bg-orange-50 text-orange-700',
          },
        ].map((item) => (
          <div key={item.label} className={`card p-4 ${item.color}`}>
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-sm font-medium opacity-80">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <AlertTriangle className="h-10 w-10 text-red-400" />
            <p className="text-gray-600">Failed to load queue</p>
            <button className="btn-primary text-sm" onClick={() => refetch()}>Retry</button>
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <Inbox className="h-14 w-14 opacity-20" />
            <p className="text-base font-semibold text-gray-500">Queue is empty</p>
            <p className="text-sm">No complaints are currently assigned to you.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left table-header">Complaint #</th>
                    <th className="px-5 py-3 text-left table-header">Title</th>
                    <th className="px-5 py-3 text-left table-header">Category</th>
                    <th className="px-5 py-3 text-left table-header">Priority</th>
                    <th className="px-5 py-3 text-left table-header">Status</th>
                    <th className="px-5 py-3 text-left table-header">SLA</th>
                    <th className="px-5 py-3 text-left table-header">Quick Update</th>
                    <th className="px-5 py-3 text-left table-header">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                      <td
                        className="px-5 py-3 font-mono text-blue-600 font-semibold text-xs cursor-pointer"
                        onClick={() => navigate(`/complaints/${c.id}`)}
                      >
                        #{c.complaint_number || c.id}
                      </td>
                      <td
                        className="px-5 py-3 max-w-xs cursor-pointer"
                        onClick={() => navigate(`/complaints/${c.id}`)}
                      >
                        <span className="font-medium text-gray-800 line-clamp-1">{c.title}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{c.category || '—'}</td>
                      <td className="px-5 py-3">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-5 py-3">
                        <SLACell date={c.sla_deadline} />
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={statusMap[c.id] || ''}
                          onChange={(e) => handleStatusChange(c.id, e.target.value)}
                          className="select-field text-xs py-1 w-44"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Change status...</option>
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          className="btn-primary text-xs py-1 px-3"
                          disabled={!statusMap[c.id] || updatingId === c.id}
                          onClick={(e) => { e.stopPropagation(); handleUpdate(c.id) }}
                        >
                          {updatingId === c.id ? (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><CheckCircle className="h-3.5 w-3.5" />Update</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-secondary py-1 px-3 text-xs"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />Prev
                  </button>
                  <button
                    className="btn-secondary py-1 px-3 text-xs"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next<ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
