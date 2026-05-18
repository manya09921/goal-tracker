import { useState, useEffect, useCallback } from 'react'
import { usersAPI } from '../services/api'
import Navbar from '../components/Navbar'
import { Toast, PageLoader, SectionHeader, StatCard, EmptyState } from '../components/UI'

const roleColors = {
  employee: 'text-brand-400 bg-brand-400/10',
  manager: 'text-amber-400 bg-amber-400/10',
  admin: 'text-emerald-400 bg-emerald-400/10',
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')

  const notify = (message, type = 'success') => setToast({ message, type })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await usersAPI.getAll()
      setUsers(res.data.data?.users || [])
    } catch (err) {
      notify('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleDeactivate = async (user) => {
    if (!confirm(`Deactivate ${user.name}? They will no longer be able to log in.`)) return
    try {
      await usersAPI.deactivate(user._id)
      notify(`${user.name} deactivated.`)
      fetchUsers()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to deactivate', 'error')
    }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const counts = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    employees: users.filter(u => u.role === 'employee').length,
    managers: users.filter(u => u.role === 'manager').length,
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <SectionHeader title="User Management" subtitle="View and manage all users in the system" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Users" value={counts.total} />
          <StatCard label="Active" value={counts.active} color="text-emerald-400" />
          <StatCard label="Employees" value={counts.employees} color="text-brand-400" />
          <StatCard label="Managers" value={counts.managers} color="text-amber-400" />
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            className="input max-w-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
          />
        </div>

        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="font-medium text-slate-200">All Users ({filtered.length})</h3>
          </div>
          {loading ? <PageLoader /> : filtered.length === 0 ? (
            <div className="p-8"><EmptyState message="No users found." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Name</th>
                    <th className="table-header">Email</th>
                    <th className="table-header">Role</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Joined</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => (
                    <tr key={user._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="table-cell font-medium text-slate-200">{user.name}</td>
                      <td className="table-cell text-slate-400">{user.email}</td>
                      <td className="table-cell">
                        <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${roleColors[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="table-cell">
                        {user.isActive
                          ? <span className="text-xs text-emerald-400">● Active</span>
                          : <span className="text-xs text-slate-600">● Inactive</span>}
                      </td>
                      <td className="table-cell text-slate-500 text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        {user.isActive && user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeactivate(user)}
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 px-2 py-1 rounded transition-colors"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
