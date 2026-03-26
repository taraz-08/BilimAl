import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'
import { groupsAPI } from '../../api/students'
import LangSwitcher from '../../components/ui/LangSwitcher'

export default function LoginPage() {
  const { login, register } = useAuth()
  const { t } = useLang()
  const toast = useToast()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('student')
  const [form, setForm] = useState({ email: '', password: '', full_name: '', specialization: '', group_id: '' })
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState([])

  useEffect(() => {
    groupsAPI.list().then(setGroups).catch(() => {})
  }, [])

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  // Unique specializations from groups
  const specializations = [...new Set(groups.map(g => g.specialization))]
  const filteredGroups = form.specialization
    ? groups.filter(g => g.specialization === form.specialization)
    : groups

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return
    setLoading(true)
    try {
      let user
      if (mode === 'login') {
        user = await login(form.email, form.password)
      } else {
        if (!form.full_name) { toast.error(t('fullName') + ' required'); setLoading(false); return }
        const payload = {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role,
          specialization: form.specialization || null,
          group_id: form.group_id ? parseInt(form.group_id) : null,
        }
        user = await register(payload)
      }
      navigate(user.role === 'teacher' ? '/teacher' : '/student', { replace: true })
    } catch (err) {
      toast.error(err.message || t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 md:p-12 relative bg-surface overflow-x-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-screen bg-surface-container-low -z-10" />
      <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl -z-10" />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Left column */}
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 tonal-gradient rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_stories
                </span>
              </div>
              <span className="font-headline font-black text-xl tracking-tighter text-on-surface">BilimAI</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9] text-on-surface">
              Академиялық <br />Ателье.
            </h1>
            <p className="text-lg text-on-surface-variant max-w-sm font-medium leading-relaxed">
              Ғылыми зерттеулер мен шығармашылық жаңалықтардың келесі буынына арналған нақты білім беру ортасы.
            </p>
          </div>
          <div className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 space-y-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Ғылыми Стандарт</span>
            <p className="text-sm text-on-surface-variant">
              AI негізіндегі бағалау жүйесі арқылы нақты үлгерім талдауы.
            </p>
          </div>
        </div>

        {/* Right: form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 bg-surface-container-lowest p-8 md:p-12 rounded-[2.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-outline-variant/30"
        >
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Сапарыңызды бастаңыз</h2>
                <p className="text-on-surface-variant text-sm">{t('selectRole')}</p>
              </div>
              <LangSwitcher />
            </div>

            {/* Role selection */}
            <div className="grid grid-cols-2 gap-4">
              {['student', 'teacher'].map((r) => (
                <motion.button
                  key={r}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`group relative flex flex-col items-start p-5 rounded-2xl transition-all duration-300 text-left
                    ${role === r
                      ? 'bg-surface-container-lowest ring-2 ring-primary/30 shadow-lg'
                      : 'bg-surface-container-low hover:bg-surface-container-lowest hover:ring-2 hover:ring-primary/20'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors
                    ${role === r ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-sm">
                      {r === 'student' ? 'school' : 'psychology'}
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className="block font-bold text-on-surface text-sm">{t(r)}</span>
                    <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant/70 mt-1">
                      {r === 'student' ? t('studentPortal') : t('teacherLab')}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="label-section ml-1">{t('fullName')}</label>
                  <input className="field" placeholder="Алибек Жаксыбеков"
                    value={form.full_name} onChange={set('full_name')} required />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="label-section ml-1">{t('email')}</label>
                <input className="field" placeholder="aty@university.edu" type="email"
                  value={form.email} onChange={set('email')} required />
              </div>

              <div className="space-y-1.5">
                <label className="label-section ml-1">{t('password')}</label>
                <input className="field" placeholder="••••••••" type="password"
                  value={form.password} onChange={set('password')} required minLength={6} />
              </div>

              {/* Specialization + Group — only for student registration */}
              {mode === 'register' && role === 'student' && (
                <>
                  <div className="space-y-1.5">
                    <label className="label-section ml-1">{t('specialization')}</label>
                    <select className="field" value={form.specialization} onChange={set('specialization')}>
                      <option value="">{t('selectSpecialization')}</option>
                      {specializations.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="label-section ml-1">{t('group')}</label>
                    <select className="field" value={form.group_id} onChange={set('group_id')}>
                      <option value="">{t('selectGroup')}</option>
                      {filteredGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name} — {g.specialization}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="pt-2 space-y-4">
                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="btn-primary disabled:opacity-60">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? t('loginBtn') : t('registerBtn')}
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </motion.button>

                <div className="flex items-center gap-4 py-1">
                  <div className="h-[1px] flex-grow bg-outline-variant/30" />
                  <span className="label-section">{t('or')}</span>
                  <div className="h-[1px] flex-grow bg-outline-variant/30" />
                </div>
                <button type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="w-full text-center text-sm font-bold text-primary hover:underline underline-offset-4">
                  {mode === 'login' ? t('switchToRegister') : t('switchToLogin')}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row justify-between items-center text-on-surface-variant gap-4 bg-surface-container-lowest/50 backdrop-blur-sm">
        <div className="flex gap-8 text-[10px] uppercase tracking-[0.2em] font-bold">
          <a href="#" className="hover:text-primary transition-colors">Құпиялылық хаттамасы</a>
          <a href="#" className="hover:text-primary transition-colors">Академиялық этика</a>
        </div>
        <div className="text-[10px] font-medium tracking-wide uppercase">
          © 2025 BilimAI • Нақты оқыту жүйелері
        </div>
      </footer>
    </main>
  )
}
