import { StatusBadge, EmptyState } from './UI'

export default function GoalsTable({ goals, actions, showUser = false }) {
  if (!goals?.length) return <EmptyState message="No goals found." />

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-header">Title</th>
            {showUser && <th className="table-header">Employee</th>}
            <th className="table-header">Target</th>
            <th className="table-header">Weight</th>
            <th className="table-header">Status</th>
            <th className="table-header">Lock</th>
            {actions && <th className="table-header">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {goals.map(goal => (
            <tr key={goal._id} className="hover:bg-slate-800/30 transition-colors">
              <td className="table-cell">
                <div className="font-medium text-slate-200 max-w-[200px] truncate">{goal.title}</div>
                {goal.description && (
                  <div className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate">{goal.description}</div>
                )}
                {goal.managerComment && (
                  <div className="text-xs text-amber-400/80 mt-1 italic">"{goal.managerComment}"</div>
                )}
              </td>
              {showUser && (
                <td className="table-cell">
                  <div className="text-slate-300">{goal.userId?.name || '—'}</div>
                  <div className="text-xs text-slate-500">{goal.userId?.email || ''}</div>
                </td>
              )}
              <td className="table-cell font-mono text-slate-300">{goal.target}</td>
              <td className="table-cell">
                <span className="font-mono text-brand-400">{goal.weightage}%</span>
              </td>
              <td className="table-cell">
                <StatusBadge status={goal.status} />
              </td>
              <td className="table-cell">
                {goal.locked
                  ? <span className="text-xs text-amber-400">🔒 Locked</span>
                  : <span className="text-xs text-slate-500">🔓 Open</span>}
              </td>
              {actions && (
                <td className="table-cell">
                  <div className="flex items-center gap-2 flex-wrap">
                    {actions(goal)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
