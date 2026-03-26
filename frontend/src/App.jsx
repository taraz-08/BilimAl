import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import StudentDashboard from './pages/student/StudentDashboard'
import TakeTest from './pages/student/TakeTest'
import JournalPage from './pages/student/JournalPage'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TestBuilder from './pages/teacher/TestBuilder'
import ResultsPage from './pages/teacher/ResultsPage'
import RankingPage from './pages/teacher/RankingPage'
import HandwritingPage from './pages/teacher/HandwritingPage'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Student routes */}
      <Route path="/student" element={
        <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
      } />
      <Route path="/student/test/:id" element={
        <ProtectedRoute role="student"><TakeTest /></ProtectedRoute>
      } />
      <Route path="/student/journal" element={
        <ProtectedRoute role="student"><JournalPage /></ProtectedRoute>
      } />

      {/* Teacher routes */}
      <Route path="/teacher" element={
        <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>
      } />
      <Route path="/teacher/tests" element={
        <ProtectedRoute role="teacher"><TestBuilder /></ProtectedRoute>
      } />
      <Route path="/teacher/results" element={
        <ProtectedRoute role="teacher"><ResultsPage /></ProtectedRoute>
      } />
      <Route path="/teacher/ranking" element={
        <ProtectedRoute role="teacher"><RankingPage /></ProtectedRoute>
      } />
      <Route path="/teacher/handwriting" element={
        <ProtectedRoute role="teacher"><HandwritingPage /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
