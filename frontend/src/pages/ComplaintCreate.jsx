import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { AlertCircle, Send, ChevronLeft, Tag, AlignLeft, Type } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const PRIORITY_OPTIONS = [
  {
    value: 'low',
    label: 'Low',
    desc: 'Minor inconvenience, no immediate impact',
    color: 'border-green-400 bg-green-50 text-green-700',
    active: 'ring-2 ring-green-400 border-green-500',
  },
  {
    value: 'medium',
    label: 'Medium',
    desc: 'Moderate impact on operations',
    color: 'border-yellow-400 bg-yellow-50 text-yellow-700',
    active: 'ring-2 ring-yellow-400 border-yellow-500',
  },
  {
    value: 'high',
    label: 'High',
    desc: 'Significant impact, needs prompt attention',
    color: 'border-orange-400 bg-orange-50 text-orange-700',
    active: 'ring-2 ring-orange-400 border-orange-500',
  },
  {
    value: 'critical',
    label: 'Critical',
    desc: 'Severe impact, urgent resolution required',
    color: 'border-red-400 bg-red-50 text-red-700',
    active: 'ring-2 ring-red-400 border-red-500',
  },
]

export default function ComplaintCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    category_id: '',
    priority: 'medium',
    description: '',
  })
  const [errors, setErrors] = useState({})

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/api/categories')
      return res.data
    },
  })
  const categories = categoriesData?.categories || categoriesData || []

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    else if (form.title.length < 5) errs.title = 'Title must be at least 5 characters'
    if (!form.category_id) errs.category_id = 'Please select a category'
    if (!form.description.trim()) errs.description = 'Description is required'
    else if (form.description.length < 20)
      errs.description = 'Description must be at least 20 characters'
    return errs
  }

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/api/complaints', data)
      return res.data
    },
    onSuccess: (data) => {
      toast.success('Complaint submitted successfully!')
      navigate(`/complaints/${data.id}`)
    },
    onError: (err) => {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to submit complaint. Please try again.'
      toast.error(msg)
    },
  })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    mutation.mutate({
      title: form.title.trim(),
      category_id: parseInt(form.category_id, 10) || form.category_id,
      priority: form.priority,
      description: form.description.trim(),
    })
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Back */}
      <button
        className="btn-ghost text-sm mb-5 -ml-2"
        onClick={() => navigate('/complaints')}
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Complaints
      </button>

      <div className="card overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <h1 className="text-xl font-bold text-white">Submit New Complaint</h1>
          <p className="text-blue-100 text-sm mt-1">
            Describe your issue and we'll assign it to the right team
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="label" htmlFor="title">
              <Type className="inline h-4 w-4 mr-1 text-gray-400" />
              Complaint Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="Brief summary of your issue..."
              className={`input-field ${errors.title ? 'border-red-400 focus:ring-red-400' : ''}`}
              disabled={mutation.isPending}
            />
            <div className="flex justify-between mt-1">
              {errors.title && <p className="form-error">{errors.title}</p>}
              <span className="text-xs text-gray-400 ml-auto">{form.title.length}/100</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label" htmlFor="category_id">
              <Tag className="inline h-4 w-4 mr-1 text-gray-400" />
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className={`select-field ${
                errors.category_id ? 'border-red-400 focus:ring-red-400' : ''
              }`}
              disabled={mutation.isPending}
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="form-error">{errors.category_id}</p>}
          </div>

          {/* Priority */}
          <div>
            <label className="label">
              Priority Level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, priority: opt.value }))}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                    form.priority === opt.value
                      ? `${opt.color} ${opt.active}`
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                  disabled={mutation.isPending}
                >
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-xs mt-0.5 opacity-75 leading-tight">{opt.desc}</div>
                  {form.priority === opt.value && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-current opacity-60" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label" htmlFor="description">
              <AlignLeft className="inline h-4 w-4 mr-1 text-gray-400" />
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Please provide a detailed description of your complaint. Include relevant dates, reference numbers, and any steps you've already taken..."
              rows={7}
              className={`input-field resize-none leading-relaxed ${
                errors.description ? 'border-red-400 focus:ring-red-400' : ''
              }`}
              disabled={mutation.isPending}
            />
            <div className="flex justify-between mt-1">
              {errors.description && <p className="form-error">{errors.description}</p>}
              <span className="text-xs text-gray-400 ml-auto">{form.description.length} chars</span>
            </div>
          </div>

          {/* Error from mutation */}
          {mutation.isError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Failed to submit. Please try again.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => navigate('/complaints')}
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
