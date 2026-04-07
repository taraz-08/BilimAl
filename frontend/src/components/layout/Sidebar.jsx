import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'

const Icon = ({ name, filled = false }) => (
  <span
    className="material-symbols-outlined text-[20px]"
    style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
  >
    {name}
  </span>
)

function Avatar({ name }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #9b0f14, #c0191f)' }}>
      {initials}
    </div>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { t } = useLang()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const isStudent = user?.role === 'student'

  const studentLinks = [
    { to: '/student', icon: 'grid_view', label: t('dashboard'), end: true },
    { to: '/student/journal', icon: 'auto_stories', label: t('journalTitle') },
  ]

  const teacherLinks = [
    { to: '/teacher', icon: 'grid_view', label: t('dashboard'), end: true },
    { to: '/teacher/tests', icon: 'menu_book', label: t('testBuilder'), end: true },
    { to: '/teacher/results', icon: 'bar_chart_4_bars', label: t('analytics') },
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
      className="h-screen w-64 fixed left-0 top-0 z-40 hidden md:flex flex-col transition-colors duration-300"
      style={{
        backgroundColor: 'var(--color-sidebar-bg)',
        borderRight: '1px solid var(--color-sidebar-border)',
      }}
    >
      {/* Brand */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--color-sidebar-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #9b0f14, #db322f)' }}>
            <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_stories
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black leading-none tracking-tight" style={{ color: 'var(--color-on-surface)' }}>BilimAI</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold mt-0.5" style={{ color: 'var(--color-primary)' }}>
              {isStudent ? t('sidebarStudentTag') : t('sidebarTeacherTag')}
            </p>
          </div>
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'var(--color-surface-container-high)', color: 'var(--color-on-surface-variant)' }}
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {dark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="label-section px-3 mb-3">Навигация</p>
        <nav className="flex flex-col gap-1">
          {links.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
            >
              {({ isActive }) => (
                <>
                  <Icon name={icon} filled={isActive} />
                  <span className="text-sm">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User profile block */}
      <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--color-sidebar-border)' }}>
        {/* User info */}
        <div className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface-container-low)' }}>
          <Avatar name={user?.full_name} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-on-surface)' }}>
              {user?.full_name?.split(' ')[0] || 'Пайдаланушы'}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--color-primary)' }}>
              {isStudent ? 'Студент' : 'Оқытушы'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-red-50 hover:text-red-600"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          <Icon name="logout" />
          {t('logout')}
        </button>
      </div>
    </aside>
  )
}
