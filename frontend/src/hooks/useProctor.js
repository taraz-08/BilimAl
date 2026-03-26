/**
 * Proctoring Engine v4 — Google Vision API
 * Uses refs to avoid stale closure / interval-reset issues.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { proctorAPI } from '../api/tests'

const MAX_VIOLATIONS = 3
const ANALYZE_MS = 3500

export function useProctor({ onTerminate, enabled = true, testId = null }) {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const streamRef   = useRef(null)
  const intervalRef = useRef(null)

  // Keep latest values accessible inside interval without re-creating it
  const terminatedRef     = useRef(false)
  const analyzingRef      = useRef(false)
  const violationCountRef = useRef(0)
  const lastObjectRef     = useRef({})
  const onTerminateRef    = useRef(onTerminate)
  const testIdRef         = useRef(testId)

  useEffect(() => { onTerminateRef.current = onTerminate }, [onTerminate])
  useEffect(() => { testIdRef.current = testId }, [testId])

  const [violations,    setViolations]    = useState([])
  const [lastViolation, setLastViolation] = useState(null)
  const [terminated,    setTerminated]    = useState(false)
  const [cameraReady,   setCameraReady]   = useState(false)

  // ── Capture JPEG frame ───────────────────────────────────────────────────
  const captureFrame = useCallback(() => {
    try {
      const v = videoRef.current
      if (!v || !v.videoWidth) return null
      const c = document.createElement('canvas')
      c.width  = v.videoWidth
      c.height = v.videoHeight
      c.getContext('2d').drawImage(v, 0, 0)
      return c.toDataURL('image/jpeg', 0.7)
    } catch { return null }
  }, [])

  // ── Add violation (ref-safe) ─────────────────────────────────────────────
  const addViolation = useCallback((type, message, screenshot) => {
    if (terminatedRef.current) return
    violationCountRef.current += 1
    const count = violationCountRef.current
    const v = { type, message, time: new Date().toLocaleTimeString(), count }

    setViolations(prev => [...prev, v])
    setLastViolation(v)

    proctorAPI.reportViolation({
      test_id: testIdRef.current,
      violation_type: type,
      screenshot: screenshot || captureFrame(),
    }).catch(() => {})

    if (count >= MAX_VIOLATIONS) {
      terminatedRef.current = true
      setTerminated(true)
      onTerminateRef.current?.({ type, count })
    }
  }, [captureFrame])

  // ── Start camera ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 320, height: 240 },
    }).then(stream => {
      streamRef.current = stream
      const vid = videoRef.current
      if (vid) {
        vid.srcObject = stream
        vid.onloadedmetadata = () => {
          vid.play()
          setCameraReady(true)
        }
      }
    }).catch(() => addViolation('camera_denied', 'Камера қолжетімді емес'))

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [enabled]) // eslint-disable-line

  // ── Vision API analysis loop ──────────────────────────────────────────────
  useEffect(() => {
    if (!cameraReady || !enabled) return

    intervalRef.current = setInterval(async () => {
      if (terminatedRef.current || analyzingRef.current) return

      const frame = captureFrame()
      if (!frame) return

      analyzingRef.current = true
      try {
        let token = null
        try {
          const s = localStorage.getItem('bilimai_user')
          if (s) token = JSON.parse(s).access_token
        } catch {}

        const resp = await fetch('/api/proctoring/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ frame }),
        })

        if (!resp.ok) {
          console.warn('[Proctor] analyze failed:', resp.status)
          return
        }

        const data = await resp.json()
        if (data.error) {
          console.warn('[Proctor] Vision API error:', data.error)
          return
        }

        const { face_count, head_turned, looking_down, objects = [] } = data
        console.log('[Proctor]', { face_count, head_turned, looking_down, objects })

        if (face_count === 0) {
          addViolation('no_face', 'Бет анықталмады — камерадан кетпеңіз', frame)
        } else if (face_count > 1) {
          addViolation('multiple_faces', `Бөгде адам анықталды (${face_count} бет)`, frame)
        } else {
          if (head_turned) {
            addViolation('head_turned', 'Бас басқа жаққа бұрылды — экранға қараңыз', frame)
          } else if (looking_down) {
            addViolation('head_down', 'Төменге қарап тұр — алдаспан қолданылуы мүмкін', frame)
          }
        }

        const now = Date.now()
        for (const obj of objects) {
          const key = obj.label
          if (now - (lastObjectRef.current[key] || 0) < 12000) continue
          lastObjectRef.current[key] = now
          addViolation(
            `object_${key.toLowerCase().replace(/ /g, '_')}`,
            `${obj.message} (${Math.round(obj.score * 100)}%)`,
            frame
          )
        }
      } catch (e) {
        console.error('[Proctor] interval error:', e)
      } finally {
        analyzingRef.current = false
      }
    }, ANALYZE_MS)

    return () => clearInterval(intervalRef.current)
  }, [cameraReady, enabled, addViolation, captureFrame])

  // ── Tab switch ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return
    const handler = () => {
      if (document.hidden) addViolation('tab_switch', 'Басқа қосымша немесе таб ашылды')
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [enabled, addViolation])

  // ── Fullscreen ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return
    const handler = () => {
      if (!document.fullscreenElement)
        addViolation('fullscreen_exit', 'Толық экрандан шықтыңыз')
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [enabled, addViolation])

  const requestFullscreen = () =>
    document.documentElement.requestFullscreen?.().catch(() => {})

  return {
    violations, lastViolation, videoRef, canvasRef,
    terminated, cameraReady, modelsLoaded: true, requestFullscreen,
  }
}
