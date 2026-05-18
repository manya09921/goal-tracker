import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Toast } from '../components/UI'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('All fields are required'); return }
    setLoading(true)
    setError('')
    try {
      const user = await login(form.email, form.password)
      const redirectMap = { admin: '/admin', manager: '/manager', employee: '/employee' }
      navigate(redirectMap[user.role] || '/employee')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-600/30">
            <span className="text-white text-2xl font-bold">G</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-100">GoalTracker</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your workspace</p>
        </div>

        <div className="card p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={set('email')}
                placeholder="you@company.com"
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-600 text-center">
              Credentials are managed by your administrator
            </p>
          </div>
        </div>

        {/* Demo hint */}
        <div className="mt-4 card p-3">
          <p className="text-xs text-slate-500 font-medium mb-1">Demo seed accounts</p>
          <div className="space-y-0.5 font-mono text-xs text-slate-600">
            <div>admin@company.com · Admin1234!</div>
            <div>manager@company.com · Manager1234!</div>
            <div>employee@company.com · Employee1234!</div>
          </div>
        </div>
      </div>
    </div>
  )
}
