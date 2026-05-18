import { useState, useEffect, useCallback } from 'react'
import { checkinsAPI, goalsAPI } from '../services/api'
import Navbar from '../components/Navbar'
import { Toast, PageLoader, SectionHeader, EmptyState } from '../components/UI'

const statusColors = {
  on_track: 'text-emerald-400 bg-emerald-400/10',
  at_risk: 'text-amber-400 bg-amber-400/10',
  behind: 'text-red-400 bg-red-400/10',
  completed: 'text-brand-400 bg-brand-400/10',
}

export default function ManagerCheckins() {
  const [goals, setGoals] = useState([])
  const [checkinsMap, setCheckinsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const goalsRes = await goalsAPI.getAll({ status: 'approved' })
      const approvedGoals = goalsRes.data.data.goals
      setGoals(approvedGoals)

      // Fetch checkins for each approved goal
      const checkinResults = await Promise.allSettled(
        approvedGoals.map(g => checkinsAPI.getByGoal(g._id))
      )
      const map = {}
      checkinResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          map[approvedGoals[i]._id] = result.value.data.data?.checkins || []
        }
      })
      setCheckinsMap(map)
    } catch (err) {
      setToast({ message: 'Failed to load data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <SectionHeader title="Team Check-ins" subtitle="View quarterly progress on approved goals" />

        {loading ? <PageLoader /> : goals.length === 0 ? (
          <div className="card p-8">
            <EmptyState message="No approved goals in your team yet." />
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => {
              const goalCheckins = checkinsMap[goal._id] || []
              return (
                <div key={goal._id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-100">{goal.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Employee: <span className="text-slate-400">{goal.userId?.name}</span>
                        {' · '}Target: <span className="font-mono text-brand-400">{goal.target}</span>
                        {' · '}Weight: <span className="font-mono">{goal.weightage}%</span>
                      </p>
                    </div>
                    <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                      🔒 Approved
                    </span>
                  </div>

                  {goalCheckins.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">No check-ins from employee yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                        const ci = goalCheckins.find(c => c.quarter === q)
                        return (
                          <div key={q} className={`rounded-lg p-3 border ${ci ? 'bg-slate-800/50 border-slate-700' : 'border-slate-800/50 border-dashed'}`}>
                            <div className="text-xs font-mono font-bold text-slate-400 mb-2">{q}</div>
                            {ci ? (
                              <>
                                <div className="text-xl font-bold font-mono text-slate-100">{ci.actualValue}</div>
                                <div className={`text-xs mt-1 px-1.5 py-0.5 rounded inline-block ${statusColors[ci.status]}`}>
                                  {ci.status?.replace('_', ' ')}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-slate-600 italic">Not reported</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
