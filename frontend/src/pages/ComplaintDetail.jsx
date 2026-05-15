import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  AlertTriangle,
  Clock,
  User,
  Tag,
  Calendar,
  UserCheck,
  RefreshCw,
  ArrowUpCircle,
  MessageSquare,
  Star,
  CheckCircle,
  History,
} from 'lucide-react'
import { StatusBadge, PriorityBadge } from '../components/ComplaintBadge'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending_customer_response', label: 'Pending Customer Response' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

function SLABanner({ deadline }) {
  if (!deadline) return null
  const diff = new Date(deadline) - new Date()
  if (diff > 0) return null
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700">
      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
      <div>
        <span className="font-semibold">SLA Breached</span>
        <span className="ml-2 text-sm">
          Deadline was {new Date(deadline).toLocaleString()}. This complaint requires immediate attention.
        </span>
      </div>
    </div>
  )
}

function SLAValue({ date }) {
  if (!date) return <span className="text-gray-400">Not set</span>
  const deadline = new Date(date)
  const now = new Date()
  const diff = deadline - now
  const twoHours = 2 * 60 * 60 * 1000
  if (diff < 0) {
    return <span className="text-red-600 font-semibold">{deadline.toLocaleString()} — Breached!</span>
  }
  if (diff < twoHours) {
    return <span className="text-yellow-600 font-semibold">{deadline.toLocaleString()} ⚠ Soon</span>
  }
  return <span className="text-gray-700">{deadline.toLocaleString()}</span>
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()
  const queryClient = useQueryClient()

  const [assignAgentId, setAssignAgentId] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [resolution, setResolution] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')

  const { data: complaint, isLoading, isError, refetch } = useQuery({
    queryKey: ['complaint', id],
    queryFn: async () => {
      const res = await api.get(`/api/complaints/${id}`)
      return res.data
    },
  })

  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await api.get('/api/users?role=support_agent')
      return res.data
    },
    enabled: hasRole('admin', 'supervisor'),
  })
  const agents = agentsData?.users || agentsData || []

  const { data: historyData } = useQuery({
    queryKey: ['complaint-history', id],
    queryFn: async () => {
      const res = await api.get(`/api/complaints/${id}/history`)
      return res.data
    },
  })
  const history = historyData?.history || historyData || []

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['complaint', id] })
    queryClient.invalidateQueries({ queryKey: ['complaint-history', id] })
  }

  const assignMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/complaints/${id}/assign`, { agent_id: parseInt(assignAgentId, 10) }),
    onSuccess: () => { toast.success('Agent assigned successfully!'); invalidate() },
    onError: (err) => toast.error(err.response?.data?.detail || 'Assignment failed'),
  })

  const escalateMutation = useMutation({
    mutationFn: () => api.patch(`/api/complaints/${id}/escalate`),
    onSuccess: () => { toast.success('Complaint escalated!'); invalidate() },
    onError: (err) => toast.error(err.response?.data?.detail || 'Escalation failed'),
  })

  const statusMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/complaints/${id}/status`, {
        status: newStatus,
        comment: resolution || undefined,
      }),
    onSuccess: () => { toast.success('Status updated!'); invalidate(); setNewStatus(''); setResolution('') },
    onError: (err) => toast.error(err.response?.data?.detail || 'Status update failed'),
  })

  const feedbackMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/complaints/${id}/feedback`, {
        rating: feedbackRating,
        comment: feedbackComment,
      }),
    onSuccess: () => { toast.success('Feedback submitted! Thank you.'); invalidate() },
    onError: (err) => toast.error(err.response?.data?.detail || 'Feedback submission failed'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading complaint...</span>
        </div>
      </div>
    )
  }

  if (isError || !complaint) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-3">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-gray-600 font-medium">Could not load complaint</p>
        <button className="btn-primary" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    )
  }

  const isResolved = ['resolved', 'closed'].includes(complaint.status)
  const isCustomer = hasRole('customer')
  const isAgent = hasRole('support_agent')
  const isAdminOrSupervisor = hasRole('admin', 'supervisor')
  const canGiveFeedback = isCustomer && isResolved && !complaint.has_feedback

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Back button */}
      <button className="btn-ghost text-sm -ml-2" onClick={() => navigate(-1)}>
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      {/* SLA Breach Banner */}
      <SLABanner deadline={complaint.sla_deadline} />

      {/* Header Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-blue-600 font-bold text-sm">
                #{complaint.complaint_number || complaint.id}
              </span>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{complaint.title}</h1>
          </div>
          <button className="btn-ghost p-2 flex-shrink-0" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
          <InfoItem icon={User} label="Customer" value={complaint.customer?.full_name || complaint.customer_name || '—'} />
          <InfoItem icon={Tag} label="Category" value={complaint.category || '—'} />
          <InfoItem
            icon={Calendar}
            label="Created"
            value={complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : '—'}
          />
          <InfoItem
            icon={Clock}
            label="SLA Deadline"
            value={<SLAValue date={complaint.sla_deadline} />}
          />
          <InfoItem
            icon={UserCheck}
            label="Assigned Agent"
            value={complaint.assigned_agent?.full_name || complaint.assigned_agent_name || (
              <span className="text-gray-400 italic">Unassigned</span>
            )}
          />
          <InfoItem icon={History} label="Last Updated" value={complaint.updated_at ? new Date(complaint.updated_at).toLocaleDateString() : '—'} />
        </div>
      </div>

      {/* Description */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          Description
        </h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {complaint.description || 'No description provided.'}
        </p>
      </div>

      {/* Action Panels */}
      {/* Admin/Supervisor: Assign + Escalate */}
      {isAdminOrSupervisor && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Admin Actions</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Assign Agent */}
            <div className="space-y-3">
              <label className="label">Assign to Support Agent</label>
              <select
                value={assignAgentId}
                onChange={(e) => setAssignAgentId(e.target.value)}
                className="select-field"
              >
                <option value="">Select an agent...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.full_name || agent.name}
                  </option>
                ))}
              </select>
              <button
                className="btn-primary w-full text-sm"
                disabled={!assignAgentId || assignMutation.isPending}
                onClick={() => assignMutation.mutate()}
              >
                {assignMutation.isPending ? (
                  <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Assigning...</span>
                ) : (
                  <><UserCheck className="h-4 w-4" />Assign Agent</>
                )}
              </button>
            </div>

            {/* Escalate */}
            <div className="space-y-3">
              <label className="label">Escalation</label>
              <p className="text-sm text-gray-500">
                Escalate this complaint to a supervisor or higher priority handling.
              </p>
              <button
                className="btn-danger w-full text-sm"
                disabled={complaint.status === 'escalated' || escalateMutation.isPending}
                onClick={() => escalateMutation.mutate()}
              >
                {escalateMutation.isPending ? (
                  <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Escalating...</span>
                ) : (
                  <><ArrowUpCircle className="h-4 w-4" />Escalate Complaint</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Agent: Update Status */}
      {isAgent && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Update Complaint</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Update Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="select-field"
              >
                <option value="">Select new status...</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Resolution Comment (optional)</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Add notes about the resolution or current status..."
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <button
              className="btn-primary text-sm"
              disabled={!newStatus || statusMutation.isPending}
              onClick={() => statusMutation.mutate()}
            >
              {statusMutation.isPending ? (
                <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</span>
              ) : (
                <><CheckCircle className="h-4 w-4" />Update Status</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Customer Feedback */}
      {canGiveFeedback && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            <Star className="inline h-4 w-4 mr-1 text-yellow-400" />
            Rate Your Experience
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Rating</label>
              <StarRating value={feedbackRating} onChange={setFeedbackRating} />
            </div>
            <div>
              <label className="label">Comment (optional)</label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Tell us how we did..."
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <button
              className="btn-primary text-sm"
              disabled={feedbackRating === 0 || feedbackMutation.isPending}
              onClick={() => feedbackMutation.mutate()}
            >
              {feedbackMutation.isPending ? (
                <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</span>
              ) : (
                <><Star className="h-4 w-4" />Submit Feedback</>
              )}
            </button>
          </div>
        </div>
      )}

      {complaint.has_feedback && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Feedback already submitted for this complaint. Thank you!
        </div>
      )}

      {/* History Timeline */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-gray-400" />
          Complaint History
        </h2>
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No history entries yet</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-100" />
            {history.map((entry, idx) => (
              <div key={entry.id || idx} className="relative flex gap-3">
                <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white flex-shrink-0 z-10" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.old_status && (
                        <><StatusBadge status={entry.old_status} /><span className="text-gray-400 text-xs">→</span></>
                      )}
                      {entry.new_status && <StatusBadge status={entry.new_status} />}
                      {!entry.old_status && !entry.new_status && (
                        <span className="text-sm font-medium text-gray-700">{entry.action || 'Update'}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {entry.created_at ? new Date(entry.created_at).toLocaleString() : '—'}
                    </span>
                  </div>
                  {entry.comment && (
                    <p className="text-sm text-gray-600 mt-1">{entry.comment}</p>
                  )}
                  {entry.changed_by && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      by {entry.changed_by?.full_name || entry.changed_by_name || 'System'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm text-gray-700 font-medium mt-0.5">{value}</div>
    </div>
  )
}
