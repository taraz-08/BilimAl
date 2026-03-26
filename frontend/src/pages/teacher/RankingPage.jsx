import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../../components/layout/Sidebar'
import TelegramButton from '../../components/TelegramButton'
import TopNav from '../../components/layout/TopNav'
import { useLang } from '../../context/LangContext'
import { studentsAPI, groupsAPI } from '../../api/students'

export default function RankingPage() {
  const { t } = useLang()
  const [ranking, setRanking] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'improve'

  useEffect(() => {
    groupsAPI.list().then(setGroups).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    studentsAPI.getTeacherRanking(selectedGroup || null)
      .then(data => { setRanking(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedGroup])

  const displayed = filter === 'improve'
    ? ranking.filter(r => r.can_improve)
    : ranking

  const trendIcon = (t) => t === 'up' ? '↑' : t === 'down' ? '↓' : '→'
  const trendColor = (t) => t === 'up' ? 'text-green-600' : t === 'down' ? 'text-red-600' : 'text-on-surface-variant'

  const gradeColor = (g) => {
    if (g === 'A') return 'bg-green-50 text-green-700 border-green-200'
    if (g === 'B') return 'bg-blue-50 text-blue-700 border-blue-200'
    if (g === 'C') return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-red-50 text-red-700 border-red-200'
  }

  const improveCount = ranking.filter(r => r.can_improve).length

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <TopNav title={t('platformTitle')} />

      <main className="md:ml-64 pt-20 p-8 min-h-screen">
        {/* Header */}
        <header className="mb-10">
          <span className="label-section text-primary uppercase tracking-[0.05em] text-xs">{t('analytics')}</span>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mt-2 mb-2">{t('teacherRankingTitle')}</h1>
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <span className="label-section">{t('student')}</span>
            <span className="text-3xl font-black">{ranking.length}</span>
          </div>
          <div className="card">
            <span className="label-section">{t('teacherRankingImprove')}</span>
            <span className="text-3xl font-black text-amber-600">{improveCount}</span>
          </div>
          <div className="card">
            <span className="label-section">{t('statusGood')}</span>
            <span className="text-3xl font-black text-green-600">
              {ranking.filter(r => r.avg_score >= 80).length}
            </span>
          </div>
          <div className="card">
            <span className="label-section">{t('statusRisk')}</span>
            <span className="text-3xl font-black text-red-600">
              {ranking.filter(r => r.avg_score < 50).length}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
          >
            <option value="">{t('selectGroup')} ({t('all') || 'Барлығы'})</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name} — {g.specialization}</option>
            ))}
          </select>

          <div className="flex gap-2 bg-surface-container-low p-1 rounded-xl">
            {['all', 'improve'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface-variant'
                }`}
              >
                {f === 'all' ? (t('all') || 'Барлығы') : `${t('teacherRankingCanImprove')} (${improveCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="grid grid-cols-7 gap-2 p-4 border-b border-surface-container-high text-[10px] uppercase tracking-widest font-black text-on-surface-variant">
            <span>#</span>
            <span className="col-span-2">{t('fullName')}</span>
            <span>{t('group')}</span>
            <span>{t('rankingAvgScore')}</span>
            <span>{t('teacherRankingGrade')}</span>
            <span>{t('teacherRankingTrend')}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-on-surface-variant">{t('loading')}</div>
          ) : displayed.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">{t('noData')}</div>
          ) : displayed.map((entry, i) => (
            <motion.div
              key={entry.student_id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className={`grid grid-cols-7 gap-2 p-4 border-b border-surface-container-high/50 transition-colors hover:bg-surface-container-low ${
                entry.can_improve ? 'border-l-4 border-l-amber-400' : ''
              }`}
            >
              <span className="text-xs font-black text-on-surface-variant self-center">{i + 1}</span>
              <div className="col-span-2 self-center">
                <p className="text-xs font-bold text-on-surface truncate">{entry.full_name}</p>
                <p className="text-[10px] text-on-surface-variant truncate">{entry.specialization}</p>
              </div>
              <span className="text-xs text-on-surface-variant self-center truncate">{entry.group_name || '—'}</span>
              <span className="text-xs font-black self-center">{entry.avg_score}%</span>
              <div className="self-center">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${gradeColor(entry.grade_letter)}`}>
                  {entry.grade_letter}
                  {entry.can_improve && (
                    <span className="ml-1 text-amber-600">★</span>
                  )}
                </span>
              </div>
              <span className={`text-sm font-black self-center ${trendColor(entry.trend)}`}>
                {trendIcon(entry.trend)}
              </span>
            </motion.div>
          ))}
        </div>

        {improveCount > 0 && (
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600">star</span>
            <p className="text-sm text-amber-800 font-medium">
              <strong>{improveCount}</strong> студент 4→5 баллға өте алады (орт. балл 70–79%). Қосымша қолдау көрсетіңіз.
            </p>
          </div>
        )}
      </main>
      <TelegramButton />
    </div>
  )
}
