import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../../components/layout/Sidebar'
import TelegramButton from '../../components/TelegramButton'
import TopNav from '../../components/layout/TopNav'
import { useLang } from '../../context/LangContext'
import { submissionsAPI } from '../../api/tests'

export default function ResultsPage() {
  const { t } = useLang()
  const [submissions, setSubmissions] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    submissionsAPI.list()
      .then(data => { setSubmissions(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = submissions.filter(s =>
    !filter || s.test_title?.toLowerCase().includes(filter.toLowerCase())
  )

  const statusColor = (s) => {
    if (s === 'approved') return 'text-green-600 bg-green-50'
    if (s === 'ai_graded') return 'text-amber-600 bg-amber-50'
    if (s === 'rejected') return 'text-red-600 bg-red-50'
    return 'text-on-surface-variant bg-surface-container-low'
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <TopNav title={t('platformTitle')} />
      <main className="md:ml-64 pt-20 p-8 min-h-screen">
        <header className="mb-12">
          <span className="label-section text-primary uppercase tracking-[0.05em] text-xs">{t('analytics')}</span>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mt-2 mb-4">
            {t('testResults')}
          </h1>
          <p className="text-on-surface-variant">{t('testResultsDesc')}</p>
        </header>

        {/* Search */}
        <div className="mb-8">
          <input
            className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl py-3 px-5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            placeholder={t('searchByTitle')}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="grid grid-cols-5 gap-4 p-5 border-b border-surface-container-high">
            {[t('colId'), t('colTest'), t('colStudent'), t('colScore'), t('colStatus')].map(h => (
              <span key={h} className="label-section text-[9px]">{h}</span>
            ))}
          </div>
          {loading ? (
            <div className="p-12 text-center text-on-surface-variant">{t('loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">{t('noData')}</div>
          ) : filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-5 gap-4 p-5 border-b border-surface-container-high/50 hover:bg-surface-container-low transition-colors group"
            >
              <span className="text-xs font-bold text-on-surface-variant">#{s.id}</span>
              <span className="text-xs font-semibold truncate">{s.test_title || '—'}</span>
              <span className="text-xs text-on-surface-variant">#{s.student_id}</span>
              <span className="text-xs font-bold text-on-surface">—</span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full w-fit ${statusColor(s.grade?.status || s.status)}`}>
                {s.grade?.status || s.status}
              </span>
            </motion.div>
          ))}
        </div>
      </main>
      <TelegramButton />
    </div>
  )
}
