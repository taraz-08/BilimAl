import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import Sidebar from '../../components/layout/Sidebar'
import TopNav from '../../components/layout/TopNav'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import { studentsAPI } from '../../api/students'
import { testsAPI } from '../../api/tests'
import TelegramButton from '../../components/TelegramButton'

const STATUS_CONFIG = {
  good:    { color: 'text-emerald-600', bg: 'bg-emerald-50',    dot: 'bg-emerald-500', border: 'border-emerald-200' },
  average: { color: 'text-amber-600',   bg: 'bg-amber-50',      dot: 'bg-amber-500',   border: 'border-amber-200' },
  risk:    { color: 'text-red-600',     bg: 'bg-red-50',        dot: 'bg-red-500',     border: 'border-red-200' },
}

function SkeletonCard({ h = 'h-32' }) {
  return (
    <div className={`${h} rounded-2xl animate-pulse`}
      style={{ background: 'var(--color-surface-container-high)' }} />
  )
}

function StatPill({ icon, label, value, sub, color = '#2563eb' }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest ghost-border">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <span className="material-symbols-outlined text-[22px]"
          style={{ color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p className="text-xl font-black text-on-surface leading-none">{value}</p>
        <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-on-surface-variant">{sub}</p>}
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const { t } = useLang()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [grades, setGrades] = useState([])
  const [ranking, setRanking] = useState([])
  const [recs, setRecs] = useState([])
  const [prediction, setPrediction] = useState(null)
  const [availableTests, setAvailableTests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      studentsAPI.getMe(),
      studentsAPI.getGrades(),
      studentsAPI.getRanking(),
      studentsAPI.getRecommendations(),
      studentsAPI.getPrediction(),
      testsAPI.getStudentTests(),
    ]).then(([p, g, r, rc, pr, at]) => {
      if (p.status === 'fulfilled') setProfile(p.value)
      if (g.status === 'fulfilled') setGrades(g.value || [])
      if (r.status === 'fulfilled') setRanking(r.value || [])
      if (rc.status === 'fulfilled') setRecs(rc.value || [])
      if (pr.status === 'fulfilled') setPrediction(pr.value)
      if (at.status === 'fulfilled') setAvailableTests(at.value || [])
      setLoading(false)
    })
  }, [])

  const myRank = ranking.find(r => r.is_me)
  const avgScore = grades.length
    ? Math.round(grades.reduce((s, g) => s + Math.round((g.total_score / (g.max_score || 100)) * 100), 0) / grades.length)
    : null
  const chartData = grades.slice(0, 7).map((g, i) => ({
    name: `T${i + 1}`,
    score: Math.round((g.total_score / (g.max_score || 100)) * 100),
  }))

  const statusConf = prediction ? (STATUS_CONFIG[prediction.label] || STATUS_CONFIG.average) : null
  const statusLabel = prediction
    ? t('status' + prediction.label.charAt(0).toUpperCase() + prediction.label.slice(1))
    : null

  const firstName = user?.full_name?.split(' ')[0]

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <TopNav title={t('platformTitle')} />

      <main className="md:ml-64 pt-20 p-6 md:p-8 min-h-screen">

        {/* ── Hero header ── */}
        <header className="mb-8">
          <div className="rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
            {/* bg glow */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', filter: 'blur(40px)' }} />
            <div>
              <p className="text-blue-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-2">
                {t('academicProgressIndex')}
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                {t('welcomeScholar')} {firstName} 👋
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-md">{t('progressSubtitle')}</p>
            </div>
            {/* Quick stats */}
            <div className="flex gap-4 flex-shrink-0">
              <div className="text-center p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <p className="text-2xl font-black text-white">#{loading ? '…' : myRank?.rank || '—'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{t('overallRanking')}</p>
              </div>
              <div className="text-center p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <p className="text-2xl font-black text-white">{loading ? '…' : avgScore != null ? `${avgScore}%` : '—'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{t('avgScore')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Stat row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => <SkeletonCard key={i} h="h-20" />)
          ) : (
            <>
              <StatPill icon="school" label={t('overallRanking')} value={myRank ? `#${myRank.rank}` : '—'} color="#2563eb" />
              <StatPill icon="percent" label={t('avgScore')} value={avgScore != null ? `${avgScore}%` : '—'} color="#7c3aed" />
              <StatPill icon="event_available" label="Қатысу" value={profile?.attendance_percent != null ? `${profile.attendance_percent}%` : '—'} color="#059669" />
              <StatPill icon="quiz" label={t('availableTests')} value={availableTests.filter(t => !t.already_submitted).length} sub={t('testsAvailable')} color="#d97706" />
            </>
          )}
        </div>

        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Performance chart — 8 cols */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-6 ghost-border flex flex-col gap-6"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-on-surface">{t('performancePrediction')}</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">{t('predictionSubtitle')}</p>
              </div>
              {statusConf && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold border ${statusConf.color} ${statusConf.bg} ${statusConf.border}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConf.dot}`} />
                  {statusLabel}
                </div>
              )}
            </div>

            {/* Chart */}
            <div className="h-44 w-full">
              {loading ? (
                <SkeletonCard h="h-44" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={24}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant)' }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant)' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px', border: 'none',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        fontSize: '12px',
                      }}
                      formatter={(v) => [`${v}%`, 'Балл']}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i}
                          fill={entry.score >= 80 ? '#2563eb' : entry.score >= 60 ? '#d97706' : '#ef4444'}
                          opacity={i === chartData.length - 1 ? 1 : 0.5}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
                  {t('noData')}
                </div>
              )}
            </div>

            {/* AI Summary */}
            {prediction?.ai_summary && (
              <div className="flex gap-3 p-4 rounded-xl"
                style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.06))', border: '1px solid rgba(37,99,235,0.15)' }}>
                <span className="material-symbols-outlined text-blue-500 flex-shrink-0 mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <p className="text-sm text-on-surface leading-relaxed">{prediction.ai_summary}</p>
              </div>
            )}

            <div className="flex gap-8 pt-2 border-t border-outline-variant/30">
              <div>
                <p className="label-section mb-1">{t('accuracy')}</p>
                <p className="text-xl font-black text-on-surface">
                  {prediction ? `${Math.round(prediction.confidence * 100)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="label-section mb-1">{t('avgScore')}</p>
                <p className="text-xl font-black text-on-surface">
                  {prediction?.avg_score ? `${prediction.avg_score}%` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* AI Recommendations — 4 cols */}
          <div className="lg:col-span-4">
            <div className="bg-surface-container-lowest rounded-2xl p-5 ghost-border h-full flex flex-col gap-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.1))' }}>
                  <span className="material-symbols-outlined text-blue-500 text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">{t('aiRecommendations')}</h3>
              </div>

              <div className="flex flex-col gap-3 flex-1">
                {loading ? (
                  <>
                    <SkeletonCard h="h-20" />
                    <SkeletonCard h="h-20" />
                    <SkeletonCard h="h-20" />
                  </>
                ) : recs.length > 0 ? recs.slice(0, 3).map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-3.5 rounded-xl flex gap-3"
                    style={{
                      background: 'var(--color-surface-container-low)',
                      borderLeft: `3px solid ${i === 0 ? '#2563eb' : i === 1 ? '#7c3aed' : '#059669'}`,
                    }}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 mt-0.5"
                      style={{ background: i === 0 ? '#2563eb' : i === 1 ? '#7c3aed' : '#059669' }}>
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface leading-tight">{r.title}</h4>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">{r.body}</p>
                    </div>
                  </motion.div>
                )) : (
                  <p className="text-sm text-on-surface-variant">{t('noData')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Grade Cards — full row */}
          <div className="lg:col-span-12">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-black tracking-tight text-on-surface">{t('currentProgress')}</h3>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">{t('currentSemester')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => <SkeletonCard key={i} h="h-40" />)
              ) : grades.length > 0 ? grades.slice(0, 4).map((g, i) => {
                const pct = Math.round((g.total_score / (g.max_score || 100)) * 100)
                const letter = pct >= 90 ? 'A+' : pct >= 85 ? 'A' : pct >= 80 ? 'A-' : pct >= 75 ? 'B+' : pct >= 70 ? 'B' : 'C'
                const barColor = pct >= 80 ? '#2563eb' : pct >= 60 ? '#d97706' : '#ef4444'
                const textColor = pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500'
                return (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.07 }}
                    className="bg-surface-container-lowest p-5 rounded-2xl ghost-border flex flex-col gap-3"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${barColor}15` }}>
                      <span className="material-symbols-outlined text-[18px]"
                        style={{ color: barColor, fontVariationSettings: "'FILL' 1" }}>assignment</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface text-sm truncate">{g.test_title || 'Test'}</h4>
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium mt-0.5">{g.status}</p>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-4xl font-black" style={{ color: barColor }}>{letter}</span>
                      <div className="text-right">
                        <p className={`text-[10px] font-bold ${textColor}`}>
                          {pct >= 80 ? t('gradeExcellent') : pct >= 60 ? t('gradeNormal') : t('gradeNeedsWork')}
                        </p>
                        <p className="text-xs text-on-surface-variant">{g.total_score}/{g.max_score}</p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  </motion.div>
                )
              }) : (
                <div className="lg:col-span-4 text-center text-on-surface-variant py-12 text-sm bg-surface-container-lowest rounded-2xl ghost-border">
                  {t('noData')}
                </div>
              )}
            </div>
          </div>

          {/* Available Tests */}
          <div className="lg:col-span-12">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-black tracking-tight text-on-surface">{t('availableTests')}</h3>
              <span className="text-xs text-on-surface-variant font-bold">
                {availableTests.filter(t => !t.already_submitted).length} {t('testsAvailable')}
              </span>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} h="h-36" />)}
              </div>
            ) : availableTests.length === 0 ? (
              <div className="text-center text-on-surface-variant py-12 text-sm bg-surface-container-lowest rounded-2xl ghost-border">
                {t('noTestsAssigned')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTests.map((test, i) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`bg-surface-container-lowest rounded-2xl p-5 ghost-border flex flex-col gap-4 ${test.already_submitted ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(37,99,235,0.1)' }}>
                        <span className="material-symbols-outlined text-[20px]"
                          style={{ color: '#2563eb', fontVariationSettings: "'FILL' 1" }}>quiz</span>
                      </div>
                      {test.already_submitted ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                          {t('submitted')}
                        </span>
                      ) : test.deadline ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                          {t('deadline')}: {new Date(test.deadline).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface leading-snug">{test.title}</h4>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide bg-surface-container-high px-2 py-0.5 rounded-full">
                          {test.question_count} {t('questions')}
                        </span>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide bg-surface-container-high px-2 py-0.5 rounded-full">
                          {test.time_limit_minutes} {t('minutes')}
                        </span>
                        {test.difficulty && (
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide bg-surface-container-high px-2 py-0.5 rounded-full">
                            {test.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    {!test.already_submitted && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(`/student/test/${test.id}`)}
                        className="w-full py-3 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
                      >
                        <span className="material-symbols-outlined text-sm">videocam</span>
                        {t('startTest')}
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
      <TelegramButton />
    </div>
  )
}
