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
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 glass-nav z-30 flex items-center justify-between px-8">
      {/* Left */}
      <div className="flex items-center gap-6">
        <h2 className="text-xl font-bold tracking-tighter text-on-surface">
          {title || 'EduAI Platform'}
        </h2>
        <div className="hidden lg:flex gap-6">
          <span className={`text-sm font-medium ${user?.role === 'student' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-on-surface-variant'}`}>
            {t('studentMode')}
          </span>
          <span className={`text-sm font-medium ${user?.role === 'teacher' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-on-surface-variant'}`}>
            {t('teacherMode')}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <LangSwitcher />
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black ml-1">
          {initials}
        </div>
      </div>
    </header>
  )
}
