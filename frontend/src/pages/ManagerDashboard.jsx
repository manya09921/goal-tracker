import { useState, useEffect, useCallback } from 'react'
import { goalsAPI, usersAPI } from '../services/api'
import Navbar from '../components/Navbar'
import GoalsTable from '../components/GoalsTable'
import { Toast, Modal, PageLoader, SectionHeader, StatCard, FormField, EmptyState } from '../components/UI'

export default function ManagerDashboard() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [actionModal, setActionModal] = useState(null) // { type: 'approve'|'reject'|'edit', goal }
  const [comment, setComment] = useState('')
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  const notify = (message, type = 'success') => setToast({ message, type })

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterStatus ? { status: filterStatus } : {}
      const res = await goalsAPI.getAll(params)
      setGoals(res.data.data.goals)
    } catch (err) {
      notify('Failed to load team goals', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const openAction = (type, goal) => {
    setComment('')
    setEditForm({ title: goal.title, description: goal.description || '', target: goal.target, weightage: goal.weightage, managerComment: '' })
    setActionModal({ type, goal })
  }

  const handleApprove = async () => {
    setSaving(true)
    try {
      await goalsAPI.approve(actionModal.goal._id, { comment })
      notify('Goal approved and locked!')
      setActionModal(null)
      fetchGoals()
    } catch (err) {
      notify(err.response?.data?.message || 'Approval failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async () => {
    if (!comment.trim()) { notify('A rejection comment is required', 'error'); return }
    setSaving(true)
    try {
      await goalsAPI.reject(actionModal.goal._id, { comment })
      notify('Goal rejected.')
      setActionModal(null)
      fetchGoals()
    } catch (err) {
      notify(err.response?.data?.message || 'Rejection failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleManagerEdit = async () => {
    setSaving(true)
    try {
      const payload = {}
      if (editForm.title) payload.title = editForm.title
      if (editForm.description !== undefined) payload.description = editForm.description
      if (editForm.target) payload.target = Number(editForm.target)
      if (editForm.weightage) payload.weightage = Number(editForm.weightage)
      if (editForm.managerComment) payload.managerComment = editForm.managerComment
      await goalsAPI.managerEdit(actionModal.goal._id, payload)
      notify('Goal updated!')
      setActionModal(null)
      fetchGoals()
    } catch (err) {
      notify(err.response?.data?.message || 'Update failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const counts = {
    total: goals.length,
    submitted: goals.filter(g => g.status === 'submitted').length,
    approved: goals.filter(g => g.status === 'approved').length,
    rejected: goals.filter(g => g.status === 'rejected').length,
  }

  const tableActions = (goal) => (
    <>
      {goal.status === 'submitted' && (
        <>
          <button onClick={() => openAction('approve', goal)} className="btn-success text-xs px-2 py-1">Approve</button>
          <button onClick={() => openAction('reject', goal)} className="btn-danger text-xs px-2 py-1">Reject</button>
        </>
      )}
      {!goal.locked && (
        <button onClick={() => openAction('edit', goal)} className="btn-secondary text-xs px-2 py-1">Edit</button>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <SectionHeader title="Team Goals" subtitle="Review and manage your team's performance goals" />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total" value={counts.total} />
          <StatCard label="Pending Review" value={counts.submitted} color="text-amber-400" />
          <StatCard label="Approved" value={counts.approved} color="text-emerald-400" />
          <StatCard label="Rejected" value={counts.rejected} color="text-red-400" />
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['', 'draft', 'submitted', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filterStatus === s
                  ? 'bg-brand-600 border-brand-500 text-white'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="font-medium text-slate-200">Team Members' Goals</h3>
          </div>
          {loading ? <PageLoader /> : (
            <div className="p-4">
              <GoalsTable goals={goals} actions={tableActions} showUser />
            </div>
          )}
        </div>
      </main>

      {/* Approve modal */}
      {actionModal?.type === 'approve' && (
        <Modal title={`Approve: ${actionModal.goal.title}`} onClose={() => setActionModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Approving will lock this goal and prevent further employee edits.</p>
            <FormField label="Comment (optional)">
              <textarea className="input resize-none" rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Any notes for the employee…" />
            </FormField>
            <div className="flex justify-end gap-2">
              <button onClick={() => setActionModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleApprove} className="btn-success" disabled={saving}>{saving ? 'Approving…' : 'Approve Goal'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject modal */}
      {actionModal?.type === 'reject' && (
        <Modal title={`Reject: ${actionModal.goal.title}`} onClose={() => setActionModal(null)}>
          <div className="space-y-4">
            <FormField label="Rejection Reason *">
              <textarea className="input resize-none" rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Explain why this goal is being rejected…" />
            </FormField>
            <div className="flex justify-end gap-2">
              <button onClick={() => setActionModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleReject} className="btn-danger" disabled={saving}>{saving ? 'Rejecting…' : 'Reject Goal'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Manager Edit modal */}
      {actionModal?.type === 'edit' && (
        <Modal title={`Edit: ${actionModal.goal.title}`} onClose={() => setActionModal(null)}>
          <div className="space-y-4">
            {['title', 'description', 'target', 'weightage', 'managerComment'].map(field => (
              <FormField key={field} label={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}>
                <input
                  className="input"
                  type={['target', 'weightage'].includes(field) ? 'number' : 'text'}
                  value={editForm[field] ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                />
              </FormField>
            ))}
            <div className="flex justify-end gap-2">
              <button onClick={() => setActionModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleManagerEdit} className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
