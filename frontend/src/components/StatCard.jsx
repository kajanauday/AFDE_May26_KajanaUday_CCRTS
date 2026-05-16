import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  trendLabel,
  subtitle,
  onClick,
}) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      accent: 'bg-blue-600',
      ring: 'ring-blue-100',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      accent: 'bg-green-600',
      ring: 'ring-green-100',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      accent: 'bg-orange-600',
      ring: 'ring-orange-100',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      accent: 'bg-red-600',
      ring: 'ring-red-100',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      accent: 'bg-purple-600',
      ring: 'ring-purple-100',
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      accent: 'bg-yellow-600',
      ring: 'ring-yellow-100',
    },
    teal: {
      bg: 'bg-teal-50',
      icon: 'text-teal-600',
      accent: 'bg-teal-600',
      ring: 'ring-teal-100',
    },
    gray: {
      bg: 'bg-gray-50',
      icon: 'text-gray-600',
      accent: 'bg-gray-600',
      ring: 'ring-gray-100',
    },
  }

  const colors = colorMap[color] || colorMap.blue

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
      ? 'text-red-600'
      : 'text-gray-400'

  return (
    <div
      className={`card p-5 flex flex-col gap-3 ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } transition-shadow duration-200 animate-fade-in`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${colors.bg} ring-4 ${colors.ring}`}>
          {Icon && <Icon className={`h-5 w-5 ${colors.icon}`} />}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trendLabel}
          </div>
        )}
      </div>

      <div>
        <div className="text-3xl font-bold text-gray-900 tracking-tight">
          {value ?? '—'}
        </div>
        <div className="text-sm font-medium text-gray-500 mt-0.5">{label}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
      </div>

      <div className={`h-1 rounded-full ${colors.accent} opacity-40 mt-auto`} />
    </div>
  )
}
