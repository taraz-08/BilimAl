import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../../components/layout/Sidebar'
import TelegramButton from '../../components/TelegramButton'
import TopNav from '../../components/layout/TopNav'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'
import { submissionsAPI, gradesAPI } from '../../api/tests'

export default function TeacherDashboard() {
  const { t } = useLang()
  const toast = useToast()
  const [submissions, setSubmissions] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    submissionsAPI.list().then(setSubmissions).catch(() => {})
  }, [])

  const openDetail = async (sub) => {
    setSelected(sub)
    setLoadingDetail(true)
    try {
      const d = await submissionsAPI.getDetail(sub.id)
      setDetail(d)
    } catch {
      toast.error(t('error'))
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleGrade = async (gradeId, approved) => {
    setApproving(true)
    try {
      await gradesAPI.approveOrReject({ grade_id: gradeId, approved })
      toast.success(approved ? t('gradeApproved') : t('gradeRejected'))
      // Refresh
      const d = await submissionsAPI.getDetail(selected.id)
      setDetail(d)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setApproving(false)
    }
  }

  const grade = detail?.grade

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <TopNav title={t('platformTitle')} />

      <main className="pt-24 pb-12 px-6 md:pl-72 md:pr-12 min-h-screen">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-end">
          <div className="lg:col-span-8">
            <nav className="flex items-center gap-2 mb-4">
              <span className="label-section">{t('curriculum')}</span>
              <span className="material-symbols-outlined text-xs text-on-surface-variant">chevron_right</span>
              <span className="label-section text-primary">{t('review')}</span>
            </nav>
            <h3 className="text-5xl font-extrabold tracking-tight text-on-surface leading-tight">
              {t('gradingProtocol')}: <br />
              <span className="text-on-surface-variant font-light italic">
                {detail?.student_name || t('selectStudent')}
              </span>
            </h3>
          </div>
          <div className="lg:col-span-4 flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="label-section mb-1">{t('aiPredictedScore')}</p>
              <div className="text-4xl font-black text-primary">
                {grade?.ai_score != null ? Math.round(grade.ai_score) : '—'}
                <span className="text-xl font-medium text-on-surface-variant">/{grade?.max_score || 100}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: detail view */}
          <div className="lg:col-span-8 space-y-6">
            {/* AI Feedback Summary */}
            {(grade?.ai_feedback || !detail) && (
              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm ghost-border">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  <h4 className="text-sm font-bold uppercase tracking-widest">{t('aiFeedback')}</h4>
                </div>
                {!detail ? (
                  <p className="text-on-surface-variant text-sm">← {t('reviewQueue')} — {t('selectStudent')}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                      <p className="label-section mb-2">{t('strengths')}</p>
                      <p className="text-sm leading-relaxed text-on-surface">
                        {grade?.ai_feedback?.split('\n')[0] || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="label-section mb-2">{t('nlpAnalysis')}</p>
                      <div className="p-4 bg-surface-container-low rounded-lg">
                        <p className="text-xs italic text-on-secondary-fixed-variant">
                          {grade?.ai_feedback || t('noAiFeedback')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Answer cards */}
            {detail?.answers?.filter(a => a.question_type === 'written').map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-container-lowest rounded-xl p-8 shadow-sm ghost-border"
              >
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-sm font-bold uppercase tracking-widest">{t('question')} {i + 1}: {a.question?.slice(0, 60)}</h4>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">{t('writtenTag')}</span>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="label-section mb-2 block">{t('studentAnswer')}</label>
                    <div className="p-6 bg-surface-container-low rounded-xl text-base leading-relaxed text-on-surface font-light">
                      {a.written_text || '—'}
                    </div>
                  </div>
                  {grade && (
                    <div className="pt-6 border-t border-surface-container-high space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
                        <span className="label-section text-primary">{t('aiFeedbackLabel')}</span>
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {grade.ai_feedback || t('aiGradingInProgress')}
                      </p>
                      {grade.status === 'ai_graded' && (
                        <div className="mt-8 flex gap-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={approving}
                            onClick={() => handleGrade(grade.id, true)}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] shadow-lg shadow-primary/20 disabled:opacity-60"
                          >
                            {t('approveAiGrade')}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={approving}
                            onClick={() => handleGrade(grade.id, false)}
                            className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-surface-container-highest disabled:opacity-60"
                          >
                            {t('requestReview')}
                          </motion.button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Submission file / metadata */}
            {detail && (
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ghost-border">
                <h4 className="label-section mb-4">{t('submittedWork')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">{t('testLabel')}</span>
                    <span className="font-bold">{detail.test_title}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">{t('status')}</span>
                    <span className="font-bold">{detail.grade?.status || '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">{t('scoreLabel')}</span>
                    <span className="font-bold">{detail.grade?.total_score ?? '—'}/{detail.grade?.max_score ?? 100}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Review queue */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ghost-border">
              <h4 className="label-section mb-4">{t('reviewQueue')}</h4>
              <div className="space-y-3">
                {submissions.length === 0 && (
                  <p className="text-sm text-on-surface-variant">{t('noData')}</p>
                )}
                {submissions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openDetail(s)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                      ${selected?.id === s.id
                        ? 'bg-surface-container-low border-l-4 border-primary'
                        : 'hover:bg-surface-container-low'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black">
                      {s.student_id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">Submission #{s.id}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter truncate">{s.test_title}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 border border-outline-variant text-on-surface rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-surface-container-low transition-colors">
                {t('finishJournal')}
              </button>
            </div>
          </div>
        </div>
      </main>
      <TelegramButton />
    </div>
  )
}
