import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../../components/layout/Sidebar'
import TelegramButton from '../../components/TelegramButton'
import TopNav from '../../components/layout/TopNav'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'
import { testsAPI } from '../../api/tests'

const MODES = ['manual', 'topic', 'file']
const DIFFICULTIES = ['undergraduate', 'advanced', 'phd']

function DiffLabel({ val, t }) {
  const map = { undergraduate: t('diffUndergrad'), advanced: t('diffAdvanced'), phd: t('diffPhd') }
  return map[val] || val
}

export default function TestBuilder() {
  const { t } = useLang()
  const toast = useToast()

  const [mode, setMode] = useState('topic')          // manual | topic | file
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState('undergraduate')
  const [numQ, setNumQ] = useState(10)
  const [topic, setTopic] = useState('')
  const [timeLimit, setTimeLimit] = useState(60)
  const [aiProctored, setAiProctored] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedTest, setGeneratedTest] = useState(null)
  const [file, setFile] = useState(null)
  const fileRef = useRef(null)

  // Manual question builder
  const [questions, setQuestions] = useState([])
  const [qText, setQText] = useState('')
  const [qType, setQType] = useState('multiple_choice')
  const [qOptions, setQOptions] = useState(['', '', '', ''])
  const [qAnswer, setQAnswer] = useState('A')
  const [qPoints, setQPoints] = useState(10)

  const handleGenerate = async () => {
    if (!title) { toast.error(t('testTitleRequired')); return }
    setGenerating(true)
    try {
      let test
      if (mode === 'topic') {
        if (!topic) { toast.error(t('topicRequired')); return }
        test = await testsAPI.generateFromTopic({ title, topic, num_questions: numQ, difficulty })
      } else if (mode === 'file') {
        if (!file) { toast.error(t('fileRequired')); return }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('title', title)
        fd.append('num_questions', numQ)
        fd.append('difficulty', difficulty)
        test = await testsAPI.generateFromFile(fd)
      }
      setGeneratedTest(test)
      toast.success(`${t('testGenerated')} (${test.questions?.length || 0} ${t('questionsCount')})`)
    } catch (err) {
      toast.error(err.message || t('error'))
    } finally {
      setGenerating(false)
    }
  }

  const handleCreateManual = async () => {
    if (!title) { toast.error(t('testTitleRequired')); return }
    setGenerating(true)
    try {
      const created = await testsAPI.create({ title, difficulty, time_limit_minutes: timeLimit, ai_proctored: aiProctored })
      for (const q of questions) {
        await testsAPI.addQuestion(created.id, q)
      }
      setGeneratedTest(created)
      toast.success(t('testCreated'))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handlePublish = async () => {
    if (!generatedTest) return
    try {
      await testsAPI.publish(generatedTest.id)
      toast.success(t('testPublished'))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const addManualQuestion = () => {
    if (!qText) return
    setQuestions(prev => [...prev, {
      text: qText,
      question_type: qType,
      options: qType === 'multiple_choice' ? qOptions.filter(Boolean) : null,
      correct_answer: qType === 'multiple_choice' ? qAnswer : null,
      points: qPoints,
    }])
    setQText('')
    setQOptions(['', '', '', ''])
    toast.info(t('questionAdded'))
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <TopNav title={t('platformTitle')} />

      <main className="lg:ml-64 pt-24 px-6 pb-12 min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-12">
            <span className="label-section text-primary uppercase tracking-[0.05em] text-xs">{t('testGenModule')}</span>
            <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mt-2 mb-4">{t('testBuilder')}</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">{t('testBuilderDesc')}</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: main builder */}
            <div className="lg:col-span-8 space-y-8">
              {/* Mode selector */}
              <div className="flex gap-2 bg-surface-container-low p-1 rounded-2xl">
                {MODES.map(m => (
                  <motion.button
                    key={m}
                    onClick={() => setMode(m)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`flex-1 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all
                      ${mode === m ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface-variant'}`}
                  >
                    {m === 'manual' ? t('manualAdd') : m === 'topic' ? t('generateFromTopic') : t('generateFromFile')}
                  </motion.button>
                ))}
              </div>

              {/* AI Generation Section */}
              <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-ambient">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  <h3 className="text-xl font-bold tracking-tight">
                    {mode === 'manual' ? t('manualAdd') : t('aiTestGen')}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="label-section block">{t('testTitle')}</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
                      placeholder={t('testTitlePlaceholder')}
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-section block">{t('difficulty')}</label>
                    <select
                      className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none appearance-none"
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value)}
                    >
                      {DIFFICULTIES.map(d => (
                        <option key={d} value={d}><DiffLabel val={d} t={t} /></option>
                      ))}
                    </select>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {mode === 'topic' && (
                    <motion.div key="topic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="mt-8 space-y-2">
                      <label className="label-section block">{t('topicText')}</label>
                      <textarea
                        rows={5}
                        className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none resize-none"
                        placeholder={t('topicPlaceholder')}
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                      />
                    </motion.div>
                  )}
                  {mode === 'file' && (
                    <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="mt-8 space-y-2">
                      <label className="label-section block">{t('uploadFiles')}</label>
                      <div
                        className="border-2 border-dashed border-outline-variant/30 rounded-2xl p-12 text-center hover:bg-surface-container-low transition-colors cursor-pointer group"
                        onClick={() => fileRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]) }}
                      >
                        <span className="material-symbols-outlined text-4xl text-outline mb-4 group-hover:scale-110 transition-transform block">
                          cloud_upload
                        </span>
                        <p className="text-on-surface-variant">
                          {file ? file.name : t('uploadHint')}
                        </p>
                        <p className="text-xs text-outline mt-2">{t('uploadLimit')}</p>
                        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" hidden onChange={e => setFile(e.target.files[0])} />
                      </div>
                    </motion.div>
                  )}
                  {mode === 'manual' && (
                    <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="mt-8 space-y-6">
                      <div className="space-y-2">
                        <label className="label-section block">{t('questionText')}</label>
                        <textarea rows={3} className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 outline-none resize-none"
                          value={qText} onChange={e => setQText(e.target.value)} placeholder={t('questionPlaceholder')} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label-section block mb-2">{t('questionType')}</label>
                          <select className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 outline-none appearance-none"
                            value={qType} onChange={e => setQType(e.target.value)}>
                            <option value="multiple_choice">{t('questionTypeMCQ')}</option>
                            <option value="written">{t('questionTypeWritten')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="label-section block mb-2">{t('questionPoints')}</label>
                          <input type="number" min={1} max={100}
                            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 outline-none"
                            value={qPoints} onChange={e => setQPoints(+e.target.value)} />
                        </div>
                      </div>
                      {qType === 'multiple_choice' && (
                        <div className="space-y-2">
                          {['A', 'B', 'C', 'D'].map((opt, i) => (
                            <div key={opt} className="flex items-center gap-2">
                              <input type="radio" name="correct" checked={qAnswer === opt} onChange={() => setQAnswer(opt)} />
                              <span className="text-xs font-bold w-4">{opt}.</span>
                              <input
                                className="flex-1 bg-surface-container-low border-none rounded-xl py-2 px-4 outline-none text-sm"
                                value={qOptions[i]}
                                onChange={e => setQOptions(prev => { const n = [...prev]; n[i] = e.target.value; return n })}
                                placeholder={`${opt} ${t('optionPlaceholder')}`}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={addManualQuestion}
                        className="w-full py-3 bg-surface-container-high text-on-surface rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-surface-container-highest">
                        + {t('addQuestion')}
                      </button>
                      {questions.length > 0 && (
                        <div className="space-y-2">
                          {questions.map((q, i) => (
                            <div key={i} className="bg-surface-container-low p-3 rounded-xl text-sm flex justify-between">
                              <span className="truncate font-medium">{i + 1}. {q.text}</span>
                              <span className="text-[10px] text-on-surface-variant font-bold">{q.points}pt</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-surface-container-high px-4 py-2 rounded-xl flex items-center gap-3">
                      <span className="text-xs font-bold">{t('questionCount')}</span>
                      <input
                        className="w-12 bg-transparent border-none p-0 text-center font-bold text-primary focus:ring-0 outline-none"
                        type="number" value={numQ} min={1} max={50}
                        onChange={e => setNumQ(+e.target.value)}
                      />
                    </div>
                  </div>
                  <motion.button
                    onClick={mode === 'manual' ? handleCreateManual : handleGenerate}
                    disabled={generating}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl font-bold hover:scale-[1.02] shadow-md flex items-center gap-2 disabled:opacity-60"
                  >
                    {generating ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">bolt</span>
                        {mode === 'manual' ? t('save') : t('generateBtn')}
                      </>
                    )}
                  </motion.button>
                </div>
              </section>

              {/* Generated test preview */}
              {generatedTest && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tight">
                      {generatedTest.title} — {generatedTest.questions?.length || 0} {t('questionsCount')}
                    </h3>
                    <button onClick={handlePublish}
                      className="px-6 py-2 bg-on-surface text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800">
                      {t('publishTest')}
                    </button>
                  </div>
                  {generatedTest.questions?.slice(0, 5).map((q, i) => (
                    <div key={q.id} className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient">
                      <div className="flex justify-between mb-3">
                        <span className="font-bold text-sm">{i + 1}. {q.text}</span>
                        <span className="text-[10px] font-bold text-primary">{q.points}pt</span>
                      </div>
                      {q.question_type === 'multiple_choice' && q.options?.map((opt, j) => (
                        <div key={j} className={`text-sm p-2 rounded-lg mt-1 ${['A','B','C','D'][j] === q.correct_answer ? 'text-green-700 bg-green-50' : 'text-on-surface-variant'}`}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  ))}
                </motion.section>
              )}
            </div>

            {/* Right: constraints */}
            <aside className="lg:col-span-4 space-y-8">
              <section className="bg-surface-container-high rounded-2xl p-8 sticky top-24">
                <h3 className="text-lg font-bold mb-6">{t('constraints')}</h3>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="label-section">{t('timeLimit')}</label>
                      <span className="text-sm font-black text-primary">{timeLimit} {t('min')}</span>
                    </div>
                    <input
                      type="range" min={15} max={180} step={5}
                      value={timeLimit}
                      onChange={e => setTimeLimit(+e.target.value)}
                    />
                    <div className="flex justify-between text-[10px] text-outline font-bold">
                      <span>15{t('min')}</span>
                      <span>180{t('min')}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-outline-variant/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-on-surface-variant">lock</span>
                        <span className="text-sm font-bold">{t('aiProctored')}</span>
                      </div>
                      <div
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${aiProctored ? 'bg-primary' : 'bg-primary/20'}`}
                        onClick={() => setAiProctored(v => !v)}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-surface-container-lowest rounded-full transition-all ${aiProctored ? 'right-1' : 'left-1'}`} />
                      </div>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-10 py-4 bg-on-surface text-surface rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg text-[10px] uppercase tracking-widest">
                  {t('applyConstraints')}
                </button>
              </section>
            </aside>
          </div>
        </div>
      </main>
      <TelegramButton />
    </div>
  )
}
