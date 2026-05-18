import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import Login from './pages/Login'
import EmployeeDashboard from './pages/EmployeeDashboard'
import EmployeeCheckins from './pages/EmployeeCheckins'
import ManagerDashboard from './pages/ManagerDashboard'
import ManagerCheckins from './pages/ManagerCheckins'
import AdminDashboard from './pages/AdminDashboard'
import AdminGoals from './pages/AdminGoals'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  const redirectMap = { admin: '/admin', manager: '/manager', employee: '/employee' }
  return <Navigate to={redirectMap[user.role] || '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Employee routes */}
          <Route path="/employee" element={
            <ProtectedRoute roles={['employee']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/employee/checkins" element={
            <ProtectedRoute roles={['employee']}>
              <EmployeeCheckins />
            </ProtectedRoute>
          } />

          {/* Manager routes */}
          <Route path="/manager" element={
            <ProtectedRoute roles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/manager/checkins" element={
            <ProtectedRoute roles={['manager']}>
              <ManagerCheckins />
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/goals" element={
            <ProtectedRoute roles={['admin']}>
              <AdminGoals />
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
