import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Filter,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { StatusBadge, PriorityBadge } from '../components/ComplaintBadge'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

function SLACell({ date }) {
  if (!date) return <span className="text-gray-400 text-xs">—</span>
  const deadline = new Date(date)
  const now = new Date()
  const diff = deadline - now
  const twoHours = 2 * 60 * 60 * 1000

  if (diff < 0) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-xs font-semibold">{deadline.toLocaleDateString()}</span>
      </div>
    )
  }
  if (diff < twoHours) {
    return (
      <span className="text-yellow-600 text-xs font-semibold">
        {deadline.toLocaleDateString()} ⚠
      </span>
    )
  }
  return <span className="text-gray-500 text-xs">{deadline.toLocaleDateString()}</span>
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending_customer_response', label: 'Pending Response' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const PAGE_SIZE = 15

export default function ComplaintList() {
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: '',
  })

  const canCreate = hasRole('customer', 'admin')

  // Categories query
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/api/categories')
      return res.data
    },
  })
  const categories = categoriesData?.categories || categoriesData || []

  // Complaints query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['complaints', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('page_size', PAGE_SIZE)
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.category) params.append('category', filters.category)
      if (filters.search) params.append('search', filters.search)
      const res = await api.get(`/api/complaints?${params.toString()}`)
      return res.data
    },
    keepPreviousData: true,
  })

  const complaints = data?.complaints || data?.items || data || []
  const total = data?.total || complaints.length
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Complaints</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} complaint{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          {canCreate && (
            <button
              className="btn-primary text-sm"
              onClick={() => navigate('/complaints/new')}
            >
              <Plus className="h-4 w-4" />
              New Complaint
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or complaint #..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input-field pl-9 text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="select-field text-sm w-44"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="select-field text-sm w-36"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="select-field text-sm w-40"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id || cat.name} value={cat.name || cat.id}>
                {cat.name || cat}
              </option>
            ))}
          </select>

          {/* Clear */}
          {(filters.status || filters.priority || filters.category || filters.search) && (
            <button
              className="text-sm text-gray-500 hover:text-gray-700 underline"
              onClick={() => {
                setFilters({ status: '', priority: '', category: '', search: '' })
                setPage(1)
              }}
            >
              Clear filters
            </button>
          )}
        </div>
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
            <p className="text-gray-600">Failed to load complaints</p>
            <button className="btn-primary text-sm" onClick={() => refetch()}>Retry</button>
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <MessageSquare className="h-14 w-14 opacity-20" />
            <p className="text-base font-semibold text-gray-500">No complaints found</p>
            <p className="text-sm">
              {filters.status || filters.priority || filters.search
                ? 'Try adjusting your filters'
                : canCreate
                ? 'Create your first complaint to get started'
                : 'No complaints have been submitted yet'}
            </p>
            {canCreate && (
              <button
                className="btn-primary text-sm mt-2"
                onClick={() => navigate('/complaints/new')}
              >
                <Plus className="h-4 w-4" />
                New Complaint
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left table-header">Complaint #</th>
                    <th className="px-5 py-3 text-left table-header">Title</th>
                    <th className="px-5 py-3 text-left table-header">Category</th>
                    <th className="px-5 py-3 text-left table-header">Priority</th>
                    <th className="px-5 py-3 text-left table-header">Status</th>
                    <th className="px-5 py-3 text-left table-header">Assigned To</th>
                    <th className="px-5 py-3 text-left table-header">SLA Deadline</th>
                    <th className="px-5 py-3 text-left table-header">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr
                      key={c.id}
                      className="table-row"
                      onClick={() => navigate(`/complaints/${c.id}`)}
                    >
                      <td className="px-5 py-3 font-mono text-blue-600 font-semibold text-xs whitespace-nowrap">
                        #{c.complaint_number || c.id}
                      </td>
                      <td className="px-5 py-3 max-w-xs">
                        <span className="font-medium text-gray-800 line-clamp-1">{c.title}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {c.category || '—'}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {c.assigned_agent?.full_name || c.assigned_agent_name || (
                          <span className="text-gray-300 italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <SLACell date={c.sla_deadline} />
                      </td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-500">
                  Page {page} of {totalPages} · {total} records
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-secondary py-1 px-3 text-xs"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>
                  <button
                    className="btn-secondary py-1 px-3 text-xs"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
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
