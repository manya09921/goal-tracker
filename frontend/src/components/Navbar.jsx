import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = {
  employee: [
    { to: '/employee', label: 'My Goals' },
    { to: '/employee/checkins', label: 'Check-ins' },
  ],
  manager: [
    { to: '/manager', label: 'Team Goals' },
    { to: '/manager/checkins', label: 'Team Check-ins' },
  ],
  admin: [
    { to: '/admin', label: 'Users' },
    { to: '/admin/goals', label: 'All Goals' },
  ],
}

const roleColors = {
  employee: 'text-brand-400 bg-brand-400/10',
  manager: 'text-amber-400 bg-amber-400/10',
  admin: 'text-emerald-400 bg-emerald-400/10',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const links = navLinks[user?.role] || []

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              <span className="font-semibold text-slate-100 text-sm hidden sm:block">GoalTracker</span>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              {links.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                    location.pathname === link.to
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${roleColors[user?.role]}`}>
              {user?.role}
            </span>
            <span className="text-sm text-slate-400 hidden sm:block">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors duration-150 px-2 py-1 rounded hover:bg-red-400/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
