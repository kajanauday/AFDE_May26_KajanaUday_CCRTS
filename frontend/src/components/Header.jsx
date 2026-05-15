import React, { useState } from 'react'
import { Bell, Menu, Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import NotificationPanel from './NotificationPanel'
import api from '../api/axios'

export default function Header({ onToggleSidebar }) {
  const { user } = useAuth()
  const [showNotif, setShowNotif] = useState(false)

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/api/notifications')
      return res.data
    },
    refetchInterval: 30000,
  })

  const notifications = notifData?.notifications || notifData || []
  const unreadCount = notifications.filter((n) => !n.is_read).length

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Toggle + Greeting */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="btn-ghost p-2"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-gray-500" />
          </button>
          <div className="hidden sm:block">
            <span className="text-gray-500 text-sm">
              {greeting()},{' '}
              <span className="font-semibold text-gray-800">
                {user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'User'}
              </span>
            </span>
          </div>
        </div>

        {/* Right: Search + Notif */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-56">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search complaints..."
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
              readOnly
            />
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              className="relative btn-ghost p-2.5"
              onClick={() => setShowNotif((v) => !v)}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <NotificationPanel onClose={() => setShowNotif(false)} />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
