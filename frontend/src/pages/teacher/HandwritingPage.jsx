import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../../components/layout/Sidebar'
import TopNav from '../../components/layout/TopNav'
import TelegramButton from '../../components/TelegramButton'
import { useToast } from '../../context/ToastContext'
import client from '../../api/client'

export default function HandwritingPage() {
  const toast = useToast()

  const [image, setImage] = useState(null)       // preview URL
  const [imageFile, setImageFile] = useState(null)
  const [topic, setTopic] = useState('')
  const [maxPoints, setMaxPoints] = useState(10)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    setImage(URL.createObjectURL(file))
    setResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleGrade = async () => {
    if (!imageFile) return toast.error('Алдымен сурет жүктеңіз')
    if (!topic.trim()) return toast.error('Тақырыпты енгізіңіз')
    setLoading(true)
    setResult(null)
    try {
      const form = new FormData()
      form.append('image', imageFile)
      form.append('topic', topic)
      form.append('max_points', maxPoints)
      const data = await client.post('/handwriting/grade', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
    } catch (err) {
      toast.error(err.message || 'Қате болды')
    } finally {
      setLoading(false)
    }
  }

  const scorePercent = result ? Math.round((result.score / result.max_points) * 100) : 0
  const scoreColor = scorePercent >= 75 ? 'text-green-500' : scorePercent >= 50 ? 'text-amber-500' : 'text-red-500'
  const scoreBg = scorePercent >= 75 ? 'bg-surface-container border-surface-container-high' : scorePercent >= 50 ? 'bg-surface-container border-surface-container-high' : 'bg-surface-container border-surface-container-high'

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <TopNav title="BilimAI" />
      <main className="md:ml-64 pt-20 p-8 min-h-screen">
        <header className="mb-10">
          <span className="label-section text-primary uppercase tracking-[0.05em] text-xs">AI Бағалау</span>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mt-2 mb-3">
            Қолжазба Бағалау
          </h1>
          <p className="text-on-surface-variant text-sm">
            Студенттің қолмен жазған шығармасын суретке түсіріп жүктеңіз — AI өздігінен оқып бағалайды
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left — Upload + Settings */}
          <div className="space-y-6">
            {/* Image upload */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
              className={`cursor-pointer rounded-3xl border-2 border-dashed transition-all overflow-hidden
                ${dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-outline-variant/40 hover:border-primary/40 bg-surface-container-lowest'}`}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
              {image ? (
                <img src={image} alt="uploaded" className="w-full max-h-80 object-contain p-2" />
              ) : (
                <div className="p-12 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      document_scanner
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">Суретті жүктеңіз немесе сүйреп әкеліңіз</p>
                    <p className="text-sm text-on-surface-variant mt-1">PNG, JPG, HEIC — камерадан немесе файлдан</p>
                  </div>
                  <span className="text-xs px-4 py-2 bg-primary/10 text-primary rounded-full font-bold">
                    Файл таңдау
                  </span>
                </div>
              )}
            </div>

            {image && (
              <button
                onClick={() => { setImage(null); setImageFile(null); setResult(null) }}
                className="text-xs text-outline hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Суретті өшіру
              </button>
            )}

            {/* Topic + max points */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 ghost-border space-y-4">
              <div>
                <label className="label-section text-[10px] mb-2 block">Тақырып / Тапсырма</label>
                <input
                  className="w-full bg-surface-container-low rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  placeholder="Мысалы: Менің отбасым туралы шығарма"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>
              <div>
                <label className="label-section text-[10px] mb-2 block">Максималды балл</label>
                <div className="flex items-center gap-3">
                  {[5, 10, 20, 50, 100].map(n => (
                    <button
                      key={n}
                      onClick={() => setMaxPoints(n)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        maxPoints === n ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grade button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleGrade}
              disabled={loading || !imageFile || !topic.trim()}
              className="w-full py-4 tonal-gradient text-white rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Оқып жатыр...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  AI арқылы бағала
                </>
              )}
            </motion.button>
          </div>

          {/* Right — Result */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full gap-4 bg-surface-container-lowest rounded-3xl ghost-border p-12"
              >
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-on-surface-variant text-sm font-medium">AI оқып жатыр...</p>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* ── Extracted text — top ── */}
                <div className="bg-surface-container-lowest rounded-2xl ghost-border overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-outline-variant bg-surface-container-low">
                    <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>text_snippet</span>
                    <p className="label-section text-[10px]">АНЫҚТАЛҒАН МӘТІН</p>
                  </div>
                  <div className="p-5 max-h-72 overflow-y-auto">
                    <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                      {result.extracted_text || '—'}
                    </p>
                  </div>
                </div>

                {/* ── Score ── */}
                <div className="bg-surface-container-lowest rounded-2xl p-5 ghost-border">
                  <div className="flex items-center justify-between mb-3">
                    <p className="label-section text-[10px]">AI БАҒАСЫ</p>
                    <span className={`text-3xl font-black ${scoreColor}`}>
                      {result.score} <span className="text-lg font-medium text-on-surface-variant">/ {result.max_points}</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${scorePercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${scorePercent >= 75 ? 'bg-green-500' : scorePercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    />
                  </div>
                  <p className={`text-xs font-bold mt-1.5 ${scoreColor}`}>{scorePercent}%</p>
                </div>

                {/* ── Feedback ── */}
                <div className="bg-surface-container-lowest rounded-2xl p-5 ghost-border">
                  <p className="label-section text-[10px] mb-2">ПІКІР</p>
                  <p className="text-sm text-on-surface leading-relaxed">{result.feedback}</p>
                </div>

                {/* ── Strengths ── */}
                {result.strengths && (
                  <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="material-symbols-outlined text-green-600 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                      <p className="label-section text-[10px] text-green-700">КҮШТІ ЖАҚТАРЫ</p>
                    </div>
                    <p className="text-sm text-green-800">{result.strengths}</p>
                  </div>
                )}

                {/* ── Improvements ── */}
                {result.improvements && (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="material-symbols-outlined text-amber-600 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                      <p className="label-section text-[10px] text-amber-700">ЖАҚСАРТУ КЕРЕК</p>
                    </div>
                    <p className="text-sm text-amber-800">{result.improvements}</p>
                  </div>
                )}
              </motion.div>
            )}

            {!result && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden lg:flex flex-col items-center justify-center h-full text-center p-12 bg-surface-container-lowest rounded-3xl ghost-border"
              >
                <span className="material-symbols-outlined text-5xl mb-3" style={{ color: 'var(--color-outline)', fontVariationSettings: "'FILL' 1" }}>
                  rate_review
                </span>
                <p className="text-on-surface-variant text-sm">
                  Сурет жүктеп, тақырып енгізіп<br />«AI арқылы бағала» батырмасын басыңыз
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <TelegramButton />
    </div>
  )
}
