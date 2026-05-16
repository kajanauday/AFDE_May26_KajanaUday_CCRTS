import React from 'react'

const STATUS_CONFIG = {
  open: { label: 'Open', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  assigned: { label: 'Assigned', className: 'bg-purple-100 text-purple-700 border border-purple-200' },
  in_progress: { label: 'In Progress', className: 'bg-orange-100 text-orange-700 border border-orange-200' },
  pending_customer_response: {
    label: 'Pending Response',
    className: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  },
  escalated: { label: 'Escalated', className: 'bg-red-100 text-red-700 border border-red-200' },
  resolved: { label: 'Resolved', className: 'bg-green-100 text-green-700 border border-green-200' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
}

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700 border border-red-200' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700 border border-orange-200' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  low: { label: 'Low', className: 'bg-green-100 text-green-700 border border-green-200' },
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
  }
  return (
    <span className={`badge text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || {
    label: priority || 'Unknown',
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
  }
  return (
    <span className={`badge text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}

export function RoleBadge({ role }) {
  const roleMap = {
    admin: 'bg-red-100 text-red-700',
    supervisor: 'bg-purple-100 text-purple-700',
    support_agent: 'bg-blue-100 text-blue-700',
    quality_team: 'bg-teal-100 text-teal-700',
    customer: 'bg-gray-100 text-gray-600',
  }
  const labelMap = {
    admin: 'Admin',
    supervisor: 'Supervisor',
    support_agent: 'Support Agent',
    quality_team: 'Quality Team',
    customer: 'Customer',
  }
  return (
    <span className={`badge text-xs font-semibold border ${roleMap[role] || 'bg-gray-100 text-gray-600'}`}>
      {labelMap[role] || role}
    </span>
  )
}
