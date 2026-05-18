import { useState, useEffect, useCallback } from 'react'
import { goalsAPI, usersAPI } from '../services/api'
import Navbar from '../components/Navbar'
import GoalsTable from '../components/GoalsTable'
import { Toast, PageLoader, SectionHeader, StatCard } from '../components/UI'
import api from '../services/api'

export default function AdminGoals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [users, setUsers] = useState([])
  const [filterUser, setFilterUser] = useState('')

  const notify = (message, type = 'success') => setToast({ message, type })

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (filterUser) params.userId = filterUser
      const res = await goalsAPI.getAll(params)
      setGoals(res.data.data.goals)
    } catch (err) {
      notify('Failed to load goals', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterUser])

  useEffect(() => {
    usersAPI.getAll().then(res => setUsers(res.data.data?.users || [])).catch(() => {})
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  // Admin unlock: PATCH goal to set locked: false
  const handleUnlock = async (goal) => {
    if (!confirm(`Unlock goal "${goal.title}"? The employee will be able to edit it again.`)) return
    try {
      // Admin calls a direct update to unlock
      await api.patch(`/goals/${goal._id}`, { locked: false, status: 'draft' })
      notify('Goal unlocked successfully!')
      fetchGoals()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to unlock goal', 'error')
    }
  }

  const handleDelete = async (goal) => {
    if (!confirm(`Permanently delete "${goal.title}"?`)) return
    try {
      await goalsAPI.delete(goal._id)
      notify('Goal deleted.')
      fetchGoals()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete', 'error')
    }
  }

  const counts = {
    total: goals.length,
    approved: goals.filter(g => g.status === 'approved').length,
    locked: goals.filter(g => g.locked).length,
    completed: goals.filter(g => g.status === 'completed').length,
  }

  const tableActions = (goal) => (
    <div className="flex gap-2">
      {goal.locked && (
        <button onClick={() => handleUnlock(goal)} className="btn-warning text-xs px-2 py-1">
          Unlock
        </button>
      )}
      <button onClick={() => handleDelete(goal)} className="btn-danger text-xs px-2 py-1">
        Delete
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <SectionHeader title="All Goals" subtitle="System-wide goal management and oversight" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Goals" value={counts.total} />
          <StatCard label="Approved" value={counts.approved} color="text-emerald-400" />
          <StatCard label="Locked" value={counts.locked} color="text-amber-400" />
          <StatCard label="Completed" value={counts.completed} color="text-brand-400" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex gap-2 flex-wrap">
            {['', 'draft', 'submitted', 'approved', 'rejected', 'completed'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filterStatus === s
                    ? 'bg-brand-600 border-brand-500 text-white'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {s || 'All Status'}
              </button>
            ))}
          </div>
          <select
            className="input max-w-[200px] text-sm py-1.5"
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
          >
            <option value="">All Employees</option>
            {users.filter(u => u.role === 'employee').map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="card">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="font-medium text-slate-200">Goals ({goals.length})</h3>
          </div>
          {loading ? <PageLoader /> : (
            <div className="p-4">
              <GoalsTable goals={goals} actions={tableActions} showUser />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
