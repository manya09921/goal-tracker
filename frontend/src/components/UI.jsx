// Toast notification component
export function Toast({ message, type = 'info', onClose }) {
  const styles = {
    success: 'bg-emerald-900/80 border-emerald-600/50 text-emerald-300',
    error: 'bg-red-900/80 border-red-600/50 text-red-300',
    info: 'bg-brand-900/80 border-brand-600/50 text-brand-300',
    warning: 'bg-amber-900/80 border-amber-600/50 text-amber-300',
  }
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-2xl max-w-sm ${styles[type]}`}>
      <span className="font-bold text-lg">{icons[type]}</span>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  )
}

// Modal component
export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// Status badge
export function StatusBadge({ status }) {
  const map = {
    draft: 'badge-draft',
    submitted: 'badge-submitted',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    completed: 'badge-completed',
  }
  return <span className={map[status] || 'badge-draft'}>{status}</span>
}

// Loading spinner
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }
  return (
    <svg className={`animate-spin ${sizes[size]} text-brand-400`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// Page loader
export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size="lg" />
    </div>
  )
}

// Empty state
export function EmptyState({ message = 'No data found.' }) {
  return (
    <div className="text-center py-16 text-slate-500">
      <div className="text-5xl mb-4">📭</div>
      <p className="text-sm">{message}</p>
    </div>
  )
}

// Stat card
export function StatCard({ label, value, color = 'text-brand-400' }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-bold font-mono ${color}`}>{value}</p>
    </div>
  )
}

// Form field wrapper
export function FormField({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

// Section header
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Weight progress bar
export function WeightageBar({ used, total = 100 }) {
  const pct = Math.min((used / total) * 100, 100)
  const color = used === total ? 'bg-emerald-500' : used > total ? 'bg-red-500' : 'bg-brand-500'
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>Weightage used</span>
        <span className={used === total ? 'text-emerald-400 font-semibold' : ''}>{used}% / {total}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
