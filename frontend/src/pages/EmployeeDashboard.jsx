import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { goalsAPI } from '../services/api'
import Navbar from '../components/Navbar'
import GoalForm from '../components/GoalForm'
import GoalsTable from '../components/GoalsTable'
import { Toast, Modal, PageLoader, StatCard, SectionHeader, WeightageBar } from '../components/UI'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editGoal, setEditGoal] = useState(null)

  const notify = (message, type = 'success') => setToast({ message, type })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [goalsRes, summaryRes] = await Promise.all([
        goalsAPI.getAll(),
        goalsAPI.getSummary(user._id),
      ])
      setGoals(goalsRes.data.data.goals)
      setSummary(summaryRes.data.data)
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load goals', 'error')
    } finally {
      setLoading(false)
    }
  }, [user._id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async (data) => {
    setFormLoading(true)
    try {
      await goalsAPI.create(data)
      notify('Goal created successfully!')
      setShowCreateModal(false)
      fetchData()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to create goal', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async (data) => {
    setFormLoading(true)
    try {
      await goalsAPI.update(editGoal._id, data)
      notify('Goal updated!')
      setEditGoal(null)
      fetchData()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update goal', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const handleSubmit = async (goal) => {
    try {
      await goalsAPI.submit(goal._id)
      notify('Goal submitted for review!')
      fetchData()
    } catch (err) {
      notify(err.response?.data?.message || 'Submission failed', 'error')
    }
  }

  const handleDelete = async (goal) => {
    if (!confirm(`Delete "${goal.title}"?`)) return
    try {
      await goalsAPI.delete(goal._id)
      notify('Goal deleted.')
      fetchData()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete', 'error')
    }
  }

  const remainingWeight = summary ? summary.remainingWeightage : 100

  const tableActions = (goal) => {
    if (goal.locked) return <span className="text-xs text-slate-600">Locked</span>
    return (
      <>
        {goal.status === 'draft' && (
          <>
            <button onClick={() => setEditGoal(goal)} className="btn-secondary text-xs px-2 py-1">Edit</button>
            <button onClick={() => handleSubmit(goal)} className="btn-primary text-xs px-2 py-1">Submit</button>
            <button onClick={() => handleDelete(goal)} className="btn-danger text-xs px-2 py-1">Delete</button>
          </>
        )}
        {goal.status === 'rejected' && (
          <>
            <button onClick={() => setEditGoal(goal)} className="btn-secondary text-xs px-2 py-1">Edit</button>
            <button onClick={() => handleDelete(goal)} className="btn-danger text-xs px-2 py-1">Delete</button>
          </>
        )}
        {goal.status === 'submitted' && (
          <span className="text-xs text-amber-400">Awaiting review</span>
        )}
      </>
    )
  }

  const canCreate = summary && summary.totalGoals < summary.maxGoals && summary.remainingWeightage > 0

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <SectionHeader
          title={`Welcome, ${user.name}`}
          subtitle="Manage your performance goals for this cycle"
          action={
            canCreate && (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                + New Goal
              </button>
            )
          }
        />

        {/* Stats */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Goals" value={summary.totalGoals} />
            <StatCard label="Max Allowed" value={summary.maxGoals} color="text-slate-400" />
            <StatCard label="Weight Used" value={`${summary.totalWeightage}%`} color={summary.isWeightageComplete ? 'text-emerald-400' : 'text-brand-400'} />
            <StatCard label="Remaining" value={`${summary.remainingWeightage}%`} color={summary.remainingWeightage === 0 ? 'text-emerald-400' : 'text-amber-400'} />
          </div>
        )}

        {/* Weight bar */}
        {summary && (
          <div className="card p-4 mb-6">
            <WeightageBar used={summary.totalWeightage} />
            {summary.isWeightageComplete && (
              <p className="text-xs text-emerald-400 mt-2">✓ All weightage allocated — ready to submit goals!</p>
            )}
            {!canCreate && summary.totalGoals >= summary.maxGoals && (
              <p className="text-xs text-amber-400 mt-2">⚠ Maximum goal limit reached ({summary.maxGoals} goals)</p>
            )}
          </div>
        )}

        {/* Goals Table */}
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="font-medium text-slate-200">My Goals</h3>
          </div>
          {loading ? <PageLoader /> : (
            <div className="p-4">
              <GoalsTable goals={goals} actions={tableActions} />
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="Create New Goal" onClose={() => setShowCreateModal(false)}>
          <GoalForm
            onSubmit={handleCreate}
            loading={formLoading}
            remainingWeight={remainingWeight}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editGoal && (
        <Modal title="Edit Goal" onClose={() => setEditGoal(null)}>
          <GoalForm
            initial={editGoal}
            onSubmit={handleEdit}
            loading={formLoading}
            submitLabel="Save Changes"
            remainingWeight={remainingWeight + editGoal.weightage}
          />
        </Modal>
      )}
    </div>
  )
}
