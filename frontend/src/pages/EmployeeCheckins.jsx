import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { goalsAPI, checkinsAPI } from '../services/api'
import Navbar from '../components/Navbar'
import { Toast, Modal, PageLoader, SectionHeader, StatusBadge, EmptyState, FormField } from '../components/UI'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const STATUSES = ['on_track', 'at_risk', 'behind', 'completed']

const statusColors = {
  on_track: 'text-emerald-400',
  at_risk: 'text-amber-400',
  behind: 'text-red-400',
  completed: 'text-brand-400',
}

export default function EmployeeCheckins() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null) // { goalId, checkinId? }
  const [form, setForm] = useState({ quarter: 'Q1', actualValue: '', status: 'on_track', notes: '' })
  const [saving, setSaving] = useState(false)

  const notify = (message, type = 'success') => setToast({ message, type })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [goalsRes, checkinsRes] = await Promise.all([
        goalsAPI.getAll(),
        checkinsAPI.getAll(),
      ])
      setGoals(goalsRes.data.data.goals.filter(g => g.status === 'approved'))
      setCheckins(checkinsRes.data.data?.checkins || [])
    } catch (err) {
      notify('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openModal = (goalId, existing = null) => {
    if (existing) {
      setForm({ quarter: existing.quarter, actualValue: existing.actualValue, status: existing.status, notes: existing.notes || '' })
      setModal({ goalId, checkinId: existing._id })
    } else {
      setForm({ quarter: 'Q1', actualValue: '', status: 'on_track', notes: '' })
      setModal({ goalId })
    }
  }

  const handleSave = async () => {
    if (!form.actualValue) { notify('Actual value is required', 'error'); return }
    setSaving(true)
    try {
      if (modal.checkinId) {
        await checkinsAPI.update(modal.checkinId, { actualValue: Number(form.actualValue), status: form.status })
        notify('Check-in updated!')
      } else {
        await checkinsAPI.create({ goalId: modal.goalId, quarter: form.quarter, actualValue: Number(form.actualValue), status: form.status })
        notify('Check-in recorded!')
      }
      setModal(null)
      fetchData()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const getGoalCheckins = (goalId) => checkins.filter(c => c.goalId === goalId || c.goalId?._id === goalId)

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <SectionHeader title="Quarterly Check-ins" subtitle="Track progress on your approved goals" />

        {loading ? <PageLoader /> : goals.length === 0 ? (
          <div className="card p-8">
            <EmptyState message="No approved goals yet. Goals must be approved by your manager before check-ins." />
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => {
              const goalCheckins = getGoalCheckins(goal._id)
              return (
                <div key={goal._id} className="card p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-100">{goal.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Target: <span className="font-mono text-brand-400">{goal.target}</span> · Weight: <span className="font-mono">{goal.weightage}%</span></p>
                    </div>
                    <button onClick={() => openModal(goal._id)} className="btn-primary text-xs px-3 py-1.5">+ Add Check-in</button>
                  </div>

                  {goalCheckins.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">No check-ins recorded yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {goalCheckins.map(ci => (
                        <div key={ci._id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-bold text-slate-300">{ci.quarter}</span>
                            <button onClick={() => openModal(goal._id, ci)} className="text-xs text-slate-500 hover:text-slate-300">edit</button>
                          </div>
                          <div className="text-xl font-bold font-mono text-slate-100">{ci.actualValue}</div>
                          <div className={`text-xs mt-1 ${statusColors[ci.status]}`}>{ci.status?.replace('_', ' ')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {modal && (
        <Modal title={modal.checkinId ? 'Update Check-in' : 'Add Check-in'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            {!modal.checkinId && (
              <FormField label="Quarter">
                <select className="input" value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))}>
                  {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </FormField>
            )}
            <FormField label="Actual Value">
              <input type="number" className="input" value={form.actualValue} onChange={e => setForm(f => ({ ...f, actualValue: e.target.value }))} placeholder="Enter actual value achieved" />
            </FormField>
            <FormField label="Status">
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </FormField>
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
