import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'
import { groupsAPI } from '../../api/students'
import LangSwitcher from '../../components/ui/LangSwitcher'

const FEATURES = [
  { icon: 'psychology', label: 'Gemini AI талдауы', desc: 'Жеке академиялық болжам және ұсынымдар' },
  { icon: 'videocam', label: 'Ақылды прокторинг', desc: 'Google Vision API негізіндегі бақылау' },
  { icon: 'leaderboard', label: 'Нақты рейтинг', desc: 'Топтағы орыңызды бақылаңыз' },
]

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
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    groupsAPI.list().then(setGroups).catch(() => {})
  }, [])

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

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
    <main className="min-h-screen flex relative overflow-hidden bg-surface">

      {/* Subtle blobs */}
      <div className="blob w-96 h-96 top-[-6rem] left-[-4rem] opacity-10" style={{ background: 'radial-gradient(circle, #b7131a, transparent)' }} />
      <div className="blob w-80 h-80 bottom-[-4rem] right-[35%] opacity-10" style={{ background: 'radial-gradient(circle, #db322f, transparent)', animationDelay: '2s' }} />

      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center tonal-gradient">
            <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
          </div>
          <span className="font-black text-xl tracking-tight text-on-surface">BilimAI</span>
        </div>

        {/* Hero text */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider"
              style={{ color: '#b7131a', background: 'rgba(183,19,26,0.07)', border: '1px solid rgba(183,19,26,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              ЖАСАНДЫ ИНТЕЛЛЕКТ ПЛАТФОРМАСЫ
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-on-surface leading-[1.05] tracking-tight">
              Білімің<br />
              <span className="gradient-text">болашағы</span><br />
              бүгін.
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm">
              AI негізіндегі оқу платформасы — студент пен оқытушыны байланыстырады.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest ghost-border"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(183,19,26,0.08)' }}>
                  <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                </div>
                <div>
                  <p className="text-on-surface text-sm font-bold">{f.label}</p>
                  <p className="text-on-surface-variant text-xs">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-on-surface-variant text-xs">© 2026 BilimAI • Delta тобы</p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="rounded-3xl p-8 md:p-10 bg-surface-container-lowest ghost-border"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)' }}>

            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                {/* Mobile logo */}
                <div className="flex items-center gap-2 mb-4 lg:hidden">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9b0f14, #db322f)' }}>
                    <span className="material-symbols-outlined text-white text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                  </div>
                  <span className="font-black text-on-surface">BilimAI</span>
                </div>
                <h2 className="text-2xl font-black text-on-surface tracking-tight">
                  {mode === 'login' ? 'Қош келдіңіз' : 'Тіркелу'}
                </h2>
                <p className="text-on-surface-variant text-sm mt-1">
                  {mode === 'login' ? 'Аккаунтыңызға кіріңіз' : 'Жаңа аккаунт жасаңыз'}
                </p>
              </div>
              <LangSwitcher />
            </div>

            {/* Role selector — тек тіркелу кезінде */}
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {['student', 'teacher'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex items-center gap-3 p-4 rounded-2xl transition-all text-left border-2 ${
                      role === r
                        ? 'border-red-500 bg-red-50'
                        : 'border-outline-variant bg-surface-container-low hover:border-outline-variant'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      role === r ? 'bg-red-500' : 'bg-white border border-outline-variant'
                    }`}>
                      <span className={`material-symbols-outlined text-[18px] ${role === r ? 'text-white' : 'text-on-surface-variant'}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        {r === 'student' ? 'school' : 'psychology'}
                      </span>
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${role === r ? 'text-red-700' : 'text-on-surface'}`}>{t(r)}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                        {r === 'student' ? 'Студент' : 'Оқытушы'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('fullName')}</label>
                  <input className="field" placeholder="Алибек Жаксыбеков"
                    value={form.full_name} onChange={set('full_name')} required />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('email')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[18px]">mail</span>
                  <input className="field pl-9" placeholder="email@university.edu" type="email"
                    value={form.email} onChange={set('email')} required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('password')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[18px]">lock</span>
                  <input className="field pl-9 pr-10" placeholder="••••••••"
                    type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={set('password')} required minLength={6} />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-slate-600">
                    <span className="material-symbols-outlined text-[18px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {mode === 'register' && role === 'student' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('specialization')}</label>
                    <select className="field" value={form.specialization} onChange={set('specialization')}>
                      <option value="">{t('selectSpecialization')}</option>
                      {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('group')}</label>
                    <select className="field" value={form.group_id} onChange={set('group_id')}>
                      <option value="">{t('selectGroup')}</option>
                      {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name} — {g.specialization}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="pt-2 space-y-3">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? t('loginBtn') : t('registerBtn')}
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </motion.button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-surface-container-high" />
                  <span className="text-xs text-on-surface-variant font-medium">{t('or')}</span>
                  <div className="h-px flex-1 bg-surface-container-high" />
                </div>

                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="w-full text-sm font-bold text-red-600 hover:text-red-700 py-2 hover:underline underline-offset-4 transition-colors"
                >
                  {mode === 'login' ? t('switchToRegister') : t('switchToLogin')}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
