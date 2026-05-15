import React, { useEffect, useRef } from 'react'
import { X, Bell, CheckCheck, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'

function getNotifIcon(type) {
  switch (type) {
    case 'sla_breach': return <AlertCircle className="h-4 w-4 text-red-500" />
    case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'assigned': return <Info className="h-4 w-4 text-blue-500" />
    case 'escalated': return <AlertCircle className="h-4 w-4 text-orange-500" />
    default: return <Bell className="h-4 w-4 text-gray-400" />
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationPanel({ onClose }) {
  const panelRef = useRef(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/api/notifications')
      return res.data
    },
    refetchInterval: 30000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/api/notifications/mark-all-read'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const notifications = data?.notifications || data || []
  const unread = notifications.filter((n) => !n.is_read)

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-96 card shadow-xl z-50 animate-fade-in overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-500" />
          <span className="font-semibold text-gray-800 text-sm">Notifications</span>
          {unread.length > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {unread.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread.length > 0 && (
            <button
              className="btn-ghost text-xs py-1 px-2 gap-1"
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              All read
            </button>
          )}
          <button className="btn-ghost p-1.5" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[480px] overflow-y-auto scrollbar-thin divide-y divide-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <Bell className="h-8 w-8 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No notifications yet</p>
            <p className="text-xs text-gray-300">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                !notif.is_read ? 'bg-blue-50/50' : ''
              }`}
              onClick={() => {
                if (!notif.is_read) markReadMutation.mutate(notif.id)
              }}
            >
              <div className="mt-0.5 flex-shrink-0">{getNotifIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                  {notif.title || notif.message}
                </p>
                {notif.title && notif.message && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-gray-300" />
                  <span className="text-xs text-gray-400">{timeAgo(notif.created_at)}</span>
                </div>
              </div>
              {!notif.is_read && (
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
