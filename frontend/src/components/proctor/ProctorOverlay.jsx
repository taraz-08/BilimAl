/**
 * Proctor UI: camera preview corner + violation warning modal.
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../context/LangContext'

const VIOLATION_ICONS = {
  no_face: 'visibility_off',
  multiple_faces: 'group',
  tab_switch: 'tab',
  fullscreen_exit: 'fullscreen_exit',
  camera_denied: 'no_photography',
}

const MAX_VIOLATIONS = 3

export default function ProctorOverlay({ videoRef, lastViolation, violations, terminated, cameraReady, modelsLoaded }) {
  const { t } = useLang()
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (lastViolation) {
      setShowWarning(true)
      const timer = setTimeout(() => setShowWarning(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [lastViolation])

  return (
    <>
      {/* Camera preview — top-right corner */}
      <div className="fixed top-20 right-4 z-50 flex flex-col items-end gap-2">
        {/* Camera feed */}
        <div className="relative">
          <div className={`w-32 h-24 rounded-xl overflow-hidden border-2 shadow-lg ${
            cameraReady ? 'border-green-400' : 'border-slate-300 bg-slate-800'
          }`}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          {/* Status dot */}
          <div className={`absolute top-1 left-1 w-2.5 h-2.5 rounded-full ${
            cameraReady ? 'bg-green-400 animate-pulse' : 'bg-red-500'
          }`} />
        </div>

        {/* Violation counter */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
          violations.length === 0 ? 'bg-green-100 text-green-700' :
          violations.length < MAX_VIOLATIONS ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          <span className="material-symbols-outlined text-[12px]">
            {violations.length === 0 ? 'shield' : 'warning'}
          </span>
          {violations.length}/{MAX_VIOLATIONS} {t('proctorViolations')}
        </div>
      </div>

      {/* Warning modal */}
      <AnimatePresence>
        {showWarning && lastViolation && !terminated && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4"
          >
            <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-xl flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 text-2xl flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                {VIOLATION_ICONS[lastViolation.type] || 'warning'}
              </span>
              <div className="flex-1">
                <p className="font-black text-amber-800 text-sm uppercase tracking-widest">
                  {t('proctorWarning')} #{lastViolation.count}
                </p>
                <p className="text-sm text-amber-700 mt-0.5">{lastViolation.message}</p>
                <p className="text-[10px] text-amber-500 mt-1">
                  {MAX_VIOLATIONS - lastViolation.count} {t('proctorRemainingWarnings')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminated — full screen overlay */}
      <AnimatePresence>
        {terminated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-surface-container-lowest rounded-3xl p-10 max-w-md w-full mx-4 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  gavel
                </span>
              </div>
              <h2 className="text-2xl font-black text-on-surface mb-2">{t('proctorTerminatedTitle')}</h2>
              <p className="text-on-surface-variant text-sm mb-6">{t('proctorTerminatedDesc')}</p>
              <div className="space-y-2 mb-8 text-left">
                {violations.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="material-symbols-outlined text-red-400 text-sm">
                      {VIOLATION_ICONS[v.type] || 'error'}
                    </span>
                    <span>{v.time} — {v.message}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
