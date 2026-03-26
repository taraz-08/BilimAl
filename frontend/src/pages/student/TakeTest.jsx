import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'
import { testsAPI, submissionsAPI } from '../../api/tests'
import { useProctor } from '../../hooks/useProctor'
import ProctorOverlay from '../../components/proctor/ProctorOverlay'

export default function TakeTest() {
  const { id } = useParams()
  const { t } = useLang()
  const toast = useToast()
  const navigate = useNavigate()

  const [test, setTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [proctorReady, setProctorReady] = useState(false) // camera permission screen
  const startTime = useRef(Date.now())
  const timerRef = useRef(null)
  const submitCalledRef = useRef(false)

  const handleTerminate = useCallback(() => {
    clearInterval(timerRef.current)
    autoSubmitAndExit()
  }, []) // eslint-disable-line

  const { violations, lastViolation, videoRef, terminated, cameraReady, modelsLoaded, requestFullscreen } =
    useProctor({ onTerminate: handleTerminate, enabled: proctorReady, testId: id ? parseInt(id) : null })

  useEffect(() => {
    testsAPI.get(id)
      .then(res => {
        setTest(res)
        setTimeLeft(res.time_limit_minutes * 60)
        setLoading(false)
      })
      .catch(() => { toast.error(t('error')); navigate('/student') })
  }, [id])

  useEffect(() => {
    if (timeLeft === null) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timeLeft !== null])

  // Redirect after termination countdown
  useEffect(() => {
    if (terminated) {
      const t = setTimeout(() => navigate('/student'), 8000)
      return () => clearTimeout(t)
    }
  }, [terminated, navigate])

  const setAnswer = (qId, field, value) => {
    setAnswers(prev => ({ ...prev, [qId]: { ...(prev[qId] || {}), [field]: value } }))
  }

  const buildAnswerList = () =>
    (test?.questions || []).map(q => ({
      question_id: q.id,
      selected_option: answers[q.id]?.selected_option || null,
      written_text: answers[q.id]?.written_text || null,
    }))

  const autoSubmitAndExit = async (violationList) => {
    if (submitCalledRef.current) return
    submitCalledRef.current = true
    const spent = Math.round((Date.now() - startTime.current) / 1000)
    try {
      await submissionsAPI.submit({
        test_id: test.id,
        answers: buildAnswerList(),
        time_spent_seconds: spent,
      })
    } catch { /* already submitted or error — we still navigate */ }
  }

  const handleSubmit = async () => {
    if (submitCalledRef.current) return
    submitCalledRef.current = true
    clearInterval(timerRef.current)
    setSubmitting(true)
    const spent = Math.round((Date.now() - startTime.current) / 1000)
    try {
      await submissionsAPI.submit({ test_id: test.id, answers: buildAnswerList(), time_spent_seconds: spent })
      toast.success(t('testSubmitted'))
      navigate('/student')
    } catch (err) {
      toast.error(err.message || t('error'))
      setSubmitting(false)
      submitCalledRef.current = false
    }
  }

  const startProctoring = () => {
    // Enter fullscreen first, then enable proctoring
    document.documentElement.requestFullscreen?.()
      .catch(() => {})
      .finally(() => setProctorReady(true))
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  // ── Proctor permission screen ────────────────────────────────────────────
  if (!proctorReady) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-container-lowest rounded-3xl p-10 max-w-lg w-full shadow-ambient ghost-border text-center"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              videocam
            </span>
          </div>
          <h2 className="text-2xl font-black text-on-surface mb-3">{t('proctorReadyTitle')}</h2>
          <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">{t('proctorReadyDesc')}</p>

          <div className="space-y-3 text-left mb-8">
            {[
              { icon: 'face', text: t('proctorRuleCamera') },
              { icon: 'tab', text: t('proctorRuleTab') },
              { icon: 'fullscreen', text: t('proctorRuleFullscreen') },
              { icon: 'warning', text: t('proctorRuleViolations') },
            ].map(({ icon, text }) => (
              <div key={icon} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-sm flex-shrink-0 mt-0.5">{icon}</span>
                <p className="text-sm text-on-surface">{text}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-outline mb-6">{t('proctorTestTitle')}: <strong>{test.title}</strong></p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={startProctoring}
            className="w-full py-4 tonal-gradient text-white rounded-2xl font-black text-sm uppercase tracking-widest"
          >
            {t('proctorStart')}
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── Test UI ──────────────────────────────────────────────────────────────
  const questions = test?.questions || []
  const q = questions[current]
  const mins = Math.floor((timeLeft || 0) / 60).toString().padStart(2, '0')
  const secs = ((timeLeft || 0) % 60).toString().padStart(2, '0')

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Proctor camera + warning overlay */}
      <ProctorOverlay
        videoRef={videoRef}
        lastViolation={lastViolation}
        violations={violations}
        terminated={terminated}
        cameraReady={cameraReady}
        modelsLoaded={modelsLoaded}
      />

      {/* Timer bar */}
      <div className={`fixed top-0 left-0 right-0 h-16 glass-nav z-40 flex items-center justify-between px-8 ${timeLeft < 300 ? 'border-b-2 border-primary/40' : ''}`}>
        <span className="text-xl font-bold tracking-tighter">{test.title}</span>
        <div className={`font-black text-2xl tracking-tighter ${timeLeft < 300 ? 'text-primary animate-pulse' : 'text-on-surface'}`}>
          {mins}:{secs}
        </div>
        <button onClick={handleSubmit} disabled={submitting || terminated}
          className="px-6 py-2 tonal-gradient text-white rounded-xl font-bold text-sm disabled:opacity-60">
          {submitting ? '…' : t('submitTest')}
        </button>
      </div>

      <main className="flex-1 pt-24 pb-16 px-6 max-w-3xl mx-auto w-full">
        {/* Progress bar */}
        <div className="w-full h-1 bg-surface-container-high rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>

        {/* Question */}
        {q && (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient ghost-border"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="label-section text-primary">
                {t('question')} {current + 1} / {questions.length}
              </span>
              <span className="text-[10px] font-bold text-outline">{q.points} {t('points')}</span>
            </div>
            <h2 className="text-xl font-bold leading-relaxed mb-8">{q.text}</h2>

            {q.question_type === 'multiple_choice' ? (
              <div className="space-y-3">
                {(q.options || []).map((opt, i) => {
                  const letter = ['A', 'B', 'C', 'D'][i]
                  const selected = answers[q.id]?.selected_option === letter
                  return (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAnswer(q.id, 'selected_option', letter)}
                      className={`w-full text-left p-5 rounded-2xl font-medium transition-all border-2 ${
                        selected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-transparent bg-surface-container-low hover:border-outline-variant/30'
                      }`}
                    >
                      <span className="font-black mr-3">{letter}.</span>{opt}
                    </motion.button>
                  )
                })}
              </div>
            ) : (
              <textarea
                rows={8}
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 outline-none resize-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all"
                placeholder={t('writeAnswer')}
                value={answers[q.id]?.written_text || ''}
                onChange={e => setAnswer(q.id, 'written_text', e.target.value)}
              />
            )}
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            disabled={current === 0}
            onClick={() => setCurrent(c => c - 1)}
            className="flex items-center gap-2 px-6 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-surface-container-highest"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {t('prevQuestion')}
          </button>
          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent(c => c + 1)}
              className="flex items-center gap-2 px-6 py-3 tonal-gradient text-white rounded-xl font-bold text-sm"
            >
              {t('nextQuestion')}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || terminated}
              className="flex items-center gap-2 px-6 py-3 tonal-gradient text-white rounded-xl font-bold text-sm disabled:opacity-60">
              {t('submitTest')}
              <span className="material-symbols-outlined text-sm">check_circle</span>
            </button>
          )}
        </div>

        {/* Question navigator dots */}
        <div className="flex flex-wrap gap-2 mt-8 justify-center">
          {questions.map((q, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all
                ${i === current ? 'bg-primary text-white' :
                  answers[q.id] ? 'bg-green-100 text-green-700' :
                  'bg-surface-container-high text-on-surface-variant'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
