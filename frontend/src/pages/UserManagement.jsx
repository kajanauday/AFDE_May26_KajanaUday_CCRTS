import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  User,
  Lock,
  Shield,
} from 'lucide-react'
import { RoleBadge } from '../components/ComplaintBadge'
import api from '../api/axios'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'customer', label: 'Customer' },
  { value: 'support_agent', label: 'Support Agent' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'quality_team', label: 'Quality Team' },
  { value: 'admin', label: 'Admin' },
]

const EMPTY_FORM = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  role: 'customer',
}

function UserModal({ onClose, editUser }) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(editUser)
  const [form, setForm] = useState(
    isEdit
      ? { ...editUser, password: '' }
      : { ...EMPTY_FORM }
  )
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.full_name?.trim()) errs.full_name = 'Name is required'
    if (!form.email?.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    if (!isEdit && !form.password) errs.password = 'Password is required'
    if (!isEdit && form.password && form.password.length < 6)
      errs.password = 'Min 6 characters'
    if (!form.role) errs.role = 'Role is required'
    return errs
  }

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        const payload = { ...data }
        if (!payload.password) delete payload.password
        return api.put(`/api/users/${editUser.id}`, payload)
      }
      return api.post('/api/users', data)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'User updated!' : 'User created!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Operation failed')
    },
  })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    mutation.mutate(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">
            {isEdit ? 'Edit User' : 'Add New User'}
          </h3>
          <button className="btn-ghost p-2" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="label">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`input-field pl-9 ${errors.full_name ? 'border-red-400' : ''}`}
                disabled={mutation.isPending}
              />
            </div>
            {errors.full_name && <p className="form-error">{errors.full_name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="label">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="user@example.com"
                className={`input-field pl-9 ${errors.email ? 'border-red-400' : ''}`}
                disabled={mutation.isPending}
              />
            </div>
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="label">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                name="phone"
                value={form.phone || ''}
                onChange={handleChange}
                placeholder="+1 555 0100"
                className="input-field pl-9"
                disabled={mutation.isPending}
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="label">Role *</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className={`select-field pl-9 ${errors.role ? 'border-red-400' : ''}`}
                disabled={mutation.isPending}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {errors.role && <p className="form-error">{errors.role}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="label">{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder={isEdit ? 'Leave blank to keep current' : 'Min 6 characters'}
                className={`input-field pl-9 ${errors.password ? 'border-red-400' : ''}`}
                disabled={mutation.isPending}
              />
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</span>
              ) : (
                isEdit ? 'Update User' : 'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ user, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2">Delete User</h3>
        <p className="text-gray-500 text-sm mb-6">
          Are you sure you want to delete <strong>{user.full_name || user.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-danger flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UserManagement() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/api/users')
      return res.data
    },
  })

  const users = (data?.users || data || []).filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    )
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteUser(null)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Delete failed'),
  })

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            User Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all system users and their roles
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            className="btn-primary text-sm"
            onClick={() => { setEditUser(null); setShowModal(true) }}
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
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
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-gray-600">Failed to load users</p>
            <button className="btn-primary text-sm" onClick={() => refetch()}>Retry</button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <Users className="h-12 w-12 opacity-20" />
            <p className="text-base font-semibold text-gray-500">No users found</p>
            {search && <p className="text-sm">Try a different search term</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left table-header">User</th>
                  <th className="px-5 py-3 text-left table-header">Email</th>
                  <th className="px-5 py-3 text-left table-header">Phone</th>
                  <th className="px-5 py-3 text-left table-header">Role</th>
                  <th className="px-5 py-3 text-left table-header">Status</th>
                  <th className="px-5 py-3 text-left table-header">Joined</th>
                  <th className="px-5 py-3 text-right table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(u.full_name || u.name)}
                        </div>
                        <span className="font-medium text-gray-800">
                          {u.full_name || u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{u.email}</td>
                    <td className="px-5 py-3 text-gray-500">{u.phone || '—'}</td>
                    <td className="px-5 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3">
                      {u.is_active !== false ? (
                        <span className="badge bg-green-100 text-green-700 border border-green-200">Active</span>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-500 border border-gray-200">Inactive</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn-ghost p-1.5 text-blue-600 hover:bg-blue-50"
                          onClick={() => { setEditUser(u); setShowModal(true) }}
                          title="Edit user"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteUser(u)}
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              {users.length} user{users.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <UserModal
          editUser={editUser}
          onClose={() => { setShowModal(false); setEditUser(null) }}
        />
      )}
      {deleteUser && (
        <DeleteConfirmModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={() => deleteMutation.mutate(deleteUser.id)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
