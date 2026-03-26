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

const PREDICTION_COLORS = {
  good: 'bg-green-50 text-green-700',
  average: 'bg-amber-50 text-amber-700',
  risk: 'bg-red-50 text-red-600',
}

const PREDICTION_DOT = {
  good: 'bg-green-500',
  average: 'bg-amber-500',
  risk: 'bg-red-500',
}

function SkeletonCard({ h = 'h-32' }) {
  return <div className={`${h} bg-surface-container-high animate-pulse rounded-2xl`} />
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

  // Build chart data from grades
  const chartData = grades.slice(0, 7).map((g, i) => ({
    name: `T${i + 1}`,
    score: Math.round((g.total_score / (g.max_score || 100)) * 100),
  }))

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <TopNav title={t('platformTitle')} />

      <main className="md:ml-64 pt-20 p-8 min-h-screen">
        {/* Header */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-3">
              {t('academicProgressIndex')}
            </p>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-none mb-6">
              {t('welcomeScholar')} {user?.full_name?.split(' ')[0]}
            </h1>
            <p className="text-on-surface-variant leading-relaxed opacity-80 text-base">
              {t('progressSubtitle')}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                {t('overallRanking')}
              </span>
              <span className="text-3xl font-black text-on-surface">
                #{loading ? '…' : myRank?.rank || '—'}
              </span>
              <span className="text-[10px] font-medium text-on-surface-variant">
                {ranking.length} {t('outOf')} {t('student')}
              </span>
            </div>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Performance Prediction chart — 8 cols */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-8 shadow-ambient ghost-border relative overflow-hidden flex flex-col gap-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold tracking-tight mb-1">{t('performancePrediction')}</h3>
                <p className="text-sm text-on-surface-variant">{t('predictionSubtitle')}</p>
              </div>
              {prediction && (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${PREDICTION_COLORS[prediction.label] || 'bg-surface-container-low text-on-surface-variant'}`}>
                  <span className={`w-2 h-2 rounded-full ${PREDICTION_DOT[prediction.label] || 'bg-slate-400'}`} />
                  <span className="text-[10px] uppercase font-bold tracking-widest">
                    {t('predictedStatus')}: {t('status' + prediction.label.charAt(0).toUpperCase() + prediction.label.slice(1))}
                  </span>
                </div>
              )}
            </div>

            {/* Chart */}
            <div className="h-48 w-full">
              {loading ? (
                <SkeletonCard h="h-48" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={28}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#906f6c' }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#906f6c' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(v) => [`${v}%`, 'Score']}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={i === chartData.length - 1 ? '#b7131a' : '#edeeef'} />
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
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
                <span className="material-symbols-outlined text-primary text-lg flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <p className="text-sm text-on-surface leading-relaxed">{prediction.ai_summary}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{t('accuracy')}</p>
                  <p className="text-xl font-bold">{prediction ? `${Math.round(prediction.confidence * 100)}%` : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{t('avgScore')}</p>
                  <p className="text-xl font-bold">{prediction?.avg_score ? `${prediction.avg_score}%` : '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations — 4 cols */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container-low rounded-2xl p-6 flex-1 border border-transparent hover:border-outline-variant/20 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                <h3 className="text-sm font-bold uppercase tracking-widest">{t('aiRecommendations')}</h3>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <>
                    <SkeletonCard h="h-20" />
                    <SkeletonCard h="h-20" />
                  </>
                ) : recs.length > 0 ? recs.slice(0, 3).map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`bg-surface-container-lowest p-4 rounded-xl shadow-sm ${i === 0 ? 'border-l-4 border-primary' : 'border-l-4 border-outline-variant'}`}
                  >
                    <h4 className="text-sm font-bold mb-1">{r.title}</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{r.body}</p>
                  </motion.div>
                )) : (
                  <p className="text-sm text-on-surface-variant">{t('noData')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Grade Cards — full row */}
          <div className="lg:col-span-12 mt-4">
            <div className="flex items-baseline justify-between mb-8">
              <h3 className="text-3xl font-black tracking-tighter">{t('currentProgress')}</h3>
              <p className="text-sm text-primary font-bold">{t('currentSemester')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array(4).fill(0).map((_, i) => <SkeletonCard key={i} h="h-40" />)
              ) : grades.length > 0 ? grades.slice(0, 4).map((g, i) => {
                const pct = Math.round((g.total_score / (g.max_score || 100)) * 100)
                const letter = pct >= 90 ? 'A+' : pct >= 85 ? 'A' : pct >= 80 ? 'A-' : pct >= 75 ? 'B+' : pct >= 70 ? 'B' : 'C'
                return (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-surface-container-lowest p-6 rounded-2xl shadow-card flex flex-col gap-4 border border-outline-variant"
                  >
                    <div className="w-10 h-10 bg-surface-container-low rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant">assignment</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface truncate">{g.test_title || 'Test'}</h4>
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium mt-1">
                        {g.status}
                      </p>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-4xl font-black text-on-surface">{letter}</span>
                      <div className="text-right">
                        <p className={`text-[10px] font-bold ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {pct >= 80 ? t('gradeExcellent') : pct >= 60 ? t('gradeNormal') : t('gradeNeedsWork')}
                        </p>
                        <p className="text-xs text-on-surface-variant">{g.total_score}/{g.max_score}</p>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </motion.div>
                )
              }) : (
                <div className="lg:col-span-4 text-center text-on-surface-variant py-12 text-sm">
                  {t('noData')}
                </div>
              )}
            </div>
          </div>

          {/* Available Tests */}
          <div className="lg:col-span-12 mt-4">
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="text-3xl font-black tracking-tighter">{t('availableTests')}</h3>
              <span className="text-sm text-on-surface-variant">{availableTests.filter(t => !t.already_submitted).length} {t('testsAvailable')}</span>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} h="h-36" />)}
              </div>
            ) : availableTests.length === 0 ? (
              <div className="text-center text-on-surface-variant py-10 text-sm bg-surface-container-lowest rounded-2xl ghost-border">
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
                    className={`bg-surface-container-lowest rounded-2xl p-6 ghost-border flex flex-col gap-4 ${test.already_submitted ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-xl">quiz</span>
                      </div>
                      {test.already_submitted ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-green-100 text-green-700 px-2 py-1 rounded-full">{t('submitted')}</span>
                      ) : test.deadline ? (
                        <span className="text-[10px] font-bold text-amber-600">{t('deadline')}: {new Date(test.deadline).toLocaleDateString()}</span>
                      ) : null}
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface leading-snug">{test.title}</h4>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                        <span>{test.question_count} {t('questions')}</span>
                        <span>·</span>
                        <span>{test.time_limit_minutes} {t('minutes')}</span>
                        {test.difficulty && <><span>·</span><span>{test.difficulty}</span></>}
                      </div>
                    </div>
                    {!test.already_submitted && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(`/student/test/${test.id}`)}
                        className="w-full py-3 tonal-gradient text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
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
