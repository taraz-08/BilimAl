import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import LangSwitcher from '../ui/LangSwitcher'

export default function TopNav({ title }) {
  const { user } = useAuth()
  const { t } = useLang()

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 glass-nav z-30 flex items-center justify-between px-6 md:px-8">
      {/* Left */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold tracking-tight text-on-surface">
          {title || 'BilimAI'}
        </h2>
        <div className="hidden lg:flex items-center gap-1 bg-surface-container-high rounded-full px-1 py-1">
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all ${
            user?.role === 'student'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant'
          }`}>
            {t('studentMode')}
          </span>
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all ${
            user?.role === 'teacher'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant'
          }`}>
            {t('teacherMode')}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <LangSwitcher />
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>
        {/* Avatar */}
        <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white text-xs font-black ml-1"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}>
          {initials}
        </div>
      </div>
    </header>
  )
}
