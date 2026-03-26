import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../../components/layout/Sidebar'
import TelegramButton from '../../components/TelegramButton'
import TopNav from '../../components/layout/TopNav'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'
import { studentsAPI } from '../../api/students'

function SkeletonCard({ h = 'h-24' }) {
  return <div className={`${h} bg-surface-container-high animate-pulse rounded-2xl`} />
}

export default function JournalPage() {
  const { t } = useLang()
  const toast = useToast()
  const fileRef = useRef(null)

  const [journal, setJournal] = useState(null)
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    Promise.allSettled([
      studentsAPI.getJournal(),
      studentsAPI.getRanking(),
    ]).then(([j, r]) => {
      if (j.status === 'fulfilled') setJournal(j.value)
      if (r.status === 'fulfilled') setRanking(r.value || [])
      setLoading(false)
    })
  }, [])

  const handleTranscriptUpload = async (file) => {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      await studentsAPI.uploadTranscript(fd)
      toast.success(t('journalUploaded'))
      const j = await studentsAPI.getJournal()
      setJournal(j)
    } catch (err) {
      toast.error(err.message || t('error'))
    } finally {
      setUploading(false)
    }
  }

  const predColor = {
    good: 'bg-green-50 text-green-700 border-green-200',
    average: 'bg-amber-50 text-amber-700 border-amber-200',
    risk: 'bg-red-50 text-red-600 border-red-200',
  }

  const me = ranking.find(r => r.is_me)

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <TopNav title={t('platformTitle')} />

      <main className="md:ml-64 pt-20 p-8 min-h-screen">
        {/* Header */}
        <header className="mb-10">
          <span className="label-section text-primary uppercase tracking-[0.05em] text-xs">{t('journalSubtitle')}</span>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mt-2 mb-2">{t('journalTitle')}</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: AI analysis */}
          <div className="lg:col-span-8 space-y-6">

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} h="h-24" />) : (
                <>
                  <div className="card flex flex-col gap-1">
                    <span className="label-section">{t('accuracy')}</span>
                    <span className="text-3xl font-black text-on-surface">{journal?.avg_score ?? '—'}%</span>
                  </div>
                  <div className="card flex flex-col gap-1">
                    <span className="label-section">{t('journalTests')}</span>
                    <span className="text-3xl font-black text-on-surface">{journal?.test_count ?? '—'}</span>
                  </div>
                  <div className="card flex flex-col gap-1">
                    <span className="label-section">{t('journalGpa')}</span>
                    <span className="text-3xl font-black text-on-surface">{journal?.gpa ?? '—'}</span>
                  </div>
                  <div className="card flex flex-col gap-1">
                    <span className="label-section">{t('predictedStatus')}</span>
                    {journal && (
                      <span className={`text-xs font-black px-2 py-1 rounded-full border w-fit mt-1 ${predColor[journal.prediction_label] || 'bg-surface-container-low text-on-surface-variant border-outline-variant'}`}>
                        {t('status' + journal.prediction_label.charAt(0).toUpperCase() + journal.prediction_label.slice(1))}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* AI Analysis block */}
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-ambient ghost-border">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                <h3 className="text-sm font-bold uppercase tracking-widest">{t('journalAnalysis')}</h3>
              </div>
              {loading ? <SkeletonCard h="h-20" /> : (
                <p className="text-base text-on-surface leading-relaxed">{journal?.analysis || '—'}</p>
              )}

              {/* Subject-level analysis from transcript */}
              {!loading && journal?.transcript_subjects?.length > 0 && (() => {
                const strong = journal.transcript_subjects.filter(s => s.grade >= 85)
                const improve = journal.transcript_subjects.filter(s => s.grade < 75)
                const mid = journal.transcript_subjects.filter(s => s.grade >= 75 && s.grade < 85)
                return (
                  <div className="mt-6 pt-6 border-t border-surface-container-high space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('transcriptAnalysisTitle')}</p>

                    {strong.length > 0 && (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-xs font-black text-green-700 uppercase tracking-widest mb-3 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                          {t('strongSubjects')}
                        </p>
                        <div className="space-y-2">
                          {strong.map((s, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-sm text-green-800 truncate flex-1">{s.subject}</span>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                <span className="text-xs font-black text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{s.grade}%</span>
                                {s.letter && <span className="text-xs font-black text-green-600">{s.letter}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {mid.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">trending_up</span>
                          {t('midSubjects')}
                        </p>
                        <div className="space-y-2">
                          {mid.map((s, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-sm text-blue-800 truncate flex-1">{s.subject}</span>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{s.grade}%</span>
                                {s.letter && <span className="text-xs font-black text-blue-600">{s.letter}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {improve.length > 0 && (
                      <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-3 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
                          {t('improveSubjects')}
                        </p>
                        <div className="space-y-2">
                          {improve.map((s, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-sm text-red-800 truncate flex-1">{s.subject}</span>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                <span className="text-xs font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{s.grade}%</span>
                                {s.letter && <span className="text-xs font-black text-red-500">{s.letter}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* General strengths/weaknesses (non-transcript) */}
              {journal && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-surface-container-high">
                  <div>
                    <p className="label-section mb-3 text-green-700">{t('journalStrengths')}</p>
                    <ul className="space-y-2">
                      {journal.strengths.length > 0 ? journal.strengths.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                          {s}
                        </li>
                      )) : <li className="text-sm text-on-surface-variant">{t('noData')}</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="label-section mb-3 text-red-600">{t('journalWeaknesses')}</p>
                    <ul className="space-y-2">
                      {journal.weaknesses.length > 0 ? journal.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                          {w}
                        </li>
                      )) : <li className="text-sm text-on-surface-variant">{t('noData')}</li>}
                    </ul>
                  </div>
                </div>
              )}

              {journal?.advice && (
                <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-xs font-bold text-primary mb-1 uppercase tracking-widest">{t('journalAdvice')}</p>
                  <p className="text-sm text-on-surface leading-relaxed">{journal.advice}</p>
                </div>
              )}

              {/* No transcript yet — prompt */}
              {!loading && !journal?.transcript_subjects?.length && (
                <div className="mt-6 pt-6 border-t border-surface-container-high">
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="material-symbols-outlined text-amber-500">info</span>
                    <p className="text-sm text-amber-700">{t('noTranscriptHint')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Transcript upload */}
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-ambient ghost-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">upload_file</span>
                  <h3 className="text-sm font-bold uppercase tracking-widest">{t('journalUploadTranscript')}</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="px-5 py-2 tonal-gradient text-white rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-60"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : t('journalUploadTranscript')}
                </motion.button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  hidden
                  onChange={e => handleTranscriptUpload(e.target.files[0])}
                />
              </div>
              <p className="text-xs text-on-surface-variant">{t('uploadLimit')}</p>

              {journal?.gpa && (
                <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                  <span className="text-sm text-green-700 font-medium">
                    {t('journalGpa')}: <strong>{journal.gpa}</strong>
                    {journal.transcript_filename && (
                      <span className="ml-2 text-green-500 font-normal">({journal.transcript_filename})</span>
                    )}
                  </span>
                </div>
              )}

              {/* Parsed subjects table */}
              {journal?.transcript_subjects?.length > 0 && (
                <div className="mt-6">
                  <p className="label-section mb-3">{t('transcriptSubjects')}</p>
                  <div className="overflow-x-auto rounded-xl border border-surface-container-high">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-surface-container-low">
                          <th className="text-left px-4 py-2 font-bold text-on-surface-variant uppercase tracking-widest">{t('subject')}</th>
                          <th className="text-center px-3 py-2 font-bold text-on-surface-variant uppercase tracking-widest">{t('credits')}</th>
                          <th className="text-center px-3 py-2 font-bold text-on-surface-variant uppercase tracking-widest">%</th>
                          <th className="text-center px-3 py-2 font-bold text-on-surface-variant uppercase tracking-widest">{t('grade')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {journal.transcript_subjects.map((s, i) => (
                          <tr key={i} className={`border-t border-surface-container-high ${i % 2 === 0 ? '' : 'bg-surface-container-lowest'}`}>
                            <td className="px-4 py-2 text-on-surface">{s.subject}</td>
                            <td className="px-3 py-2 text-center text-on-surface-variant">{s.credits ?? '—'}</td>
                            <td className="px-3 py-2 text-center font-bold text-on-surface">
                              <span className={`px-2 py-0.5 rounded-full ${
                                s.grade >= 90 ? 'bg-green-100 text-green-700' :
                                s.grade >= 80 ? 'bg-blue-100 text-blue-700' :
                                s.grade >= 70 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-600'
                              }`}>{s.grade}</span>
                            </td>
                            <td className="px-3 py-2 text-center font-black text-primary">{s.letter ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Group ranking */}
          <div className="lg:col-span-4">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest">{t('rankingTitle')}</h3>
                {me && (
                  <span className="text-xs font-black text-primary">#{me.rank}</span>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => <SkeletonCard key={i} h="h-12" />)}
                </div>
              ) : ranking.length === 0 ? (
                <p className="text-sm text-on-surface-variant">{t('noData')}</p>
              ) : (
                <div className="space-y-2">
                  {ranking.map((entry, i) => (
                    <motion.div
                      key={entry.student_id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        entry.is_me
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-surface-container-low'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                        entry.rank === 1 ? 'bg-amber-400 text-white' :
                        entry.rank === 2 ? 'bg-slate-400 text-white' :
                        entry.rank === 3 ? 'bg-orange-400 text-white' :
                        'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {entry.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${entry.is_me ? 'text-primary' : 'text-on-surface'}`}>
                          {entry.full_name}{entry.is_me ? ' ✓' : ''}
                        </p>
                      </div>
                      <span className="text-xs font-black text-on-surface-variant flex-shrink-0">
                        {entry.avg_score}%
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <TelegramButton />
    </div>
  )
}
