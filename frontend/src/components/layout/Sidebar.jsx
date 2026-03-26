import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { motion } from 'framer-motion'

const Icon = ({ name }) => (
  <span className="material-symbols-outlined">{name}</span>
)

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { t } = useLang()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const isStudent = user?.role === 'student'
  const isTeacher = user?.role === 'teacher'

  const studentLinks = [
    { to: '/student', icon: 'dashboard', label: t('dashboard'), end: true },
    { to: '/student/journal', icon: 'auto_stories', label: t('journalTitle') },
  ]

  const teacherLinks = [
    { to: '/teacher', icon: 'dashboard', label: t('dashboard'), end: true },
    { to: '/teacher/tests', icon: 'menu_book', label: t('testBuilder'), end: true },
    { to: '/teacher/results', icon: 'assignment', label: t('analytics') },
    { to: '/teacher/ranking', icon: 'leaderboard', label: t('teacherRankingTitle') },
    { to: '/teacher/handwriting', icon: 'edit_document', label: 'Қолжазба' },
  ]

  const links = isStudent ? studentLinks : teacherLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className="h-screen w-64 fixed left-0 top-0 z-40 hidden md:flex flex-col transition-colors duration-200"
      style={{ backgroundColor: 'var(--color-sidebar-bg)', borderRight: '1px solid var(--color-outline-variant)' }}
    >
      {/* Brand */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 tonal-gradient rounded-xl flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_stories
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black leading-none" style={{ color: 'var(--color-on-surface)' }}>BilimAI</h1>
            <p className="font-sans uppercase tracking-widest text-[10px] mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
              {isStudent ? t('sidebarStudentTag') : t('sidebarTeacherTag')}
            </p>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={dark ? 'Жарық тема' : 'Қараңғы тема'}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'var(--color-surface-container-high)', color: 'var(--color-on-surface-variant)' }}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {dark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1">
          {links.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? 'nav-link-active' : 'nav-link'
              }
            >
              <Icon name={icon} />
              <span className="font-sans uppercase tracking-widest text-[10px]">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className="mt-auto p-4 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-3 hover:text-red-600 transition-all rounded-xl text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          <Icon name="logout" />
          {t('logout')}
        </button>
      </div>
    </aside>
  )
}
