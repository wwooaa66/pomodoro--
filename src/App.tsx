import { useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { TimerMode, TimerStatus } from './config'
import { TIMER_CONFIG, STATUS_LABEL } from './config'
import WindowControls from './components/WindowControls'
import ModeTabs from './components/ModeTabs'
import TimerRing from './components/TimerRing'
import ControlButtons from './components/ControlButtons'
import SessionDots from './components/SessionDots'
import ThemeToggle from './components/ThemeToggle'

// ── Helpers ──────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * Play a pleasant two-tone chime using the Web Audio API.
 * Falls back silently if the audio context can't start
 * (e.g. user hasn't interacted with the page yet).
 */
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const now = ctx.currentTime

    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.value = 880 // A5
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
    osc1.connect(gain1).connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.25)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.value = 1175 // D6 (a fifth above)
    gain2.gain.setValueAtTime(0.25, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
    osc2.connect(gain2).connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.4)
  } catch {
    // Audio not available — silently ignore
  }
}

// ── Electron API type ────────────────────────────────

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void
      close: () => void
      setAlwaysOnTop: (flag: boolean) => Promise<boolean>
      updateTimerState: (state: { secondsLeft: number; mode: string; status: string }) => Promise<void>
      sendNotification: (title: string, body: string) => Promise<void>
      onTimerStart: (cb: () => void) => void
      onTimerPause: (cb: () => void) => void
      onTimerReset: (cb: () => void) => void
      removeAllListeners: (ch: string) => void
    }
  }
}

// ── Constants ────────────────────────────────────────

const SESSIONS_PER_LONG_BREAK = 4

// ── App Component ────────────────────────────────────

export default function App() {
  // ── Core timer state ───────────────────────────────
  const [mode, setMode] = useState<TimerMode>('focus')
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [secondsLeft, setSecondsLeft] = useState(TIMER_CONFIG.focus.minutes * 60)
  const [sessionCount, setSessionCount] = useState(0) // completed *focus* sessions

  // ── UI-only state ──────────────────────────────────
  const [isLight, setIsLight] = useState(false)
  const [alwaysOnTop, setAlwaysOnTop] = useState(true)

  // ── Refs (avoid stale closures in setInterval) ─────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const secondsRef = useRef(secondsLeft)
  const modeRef = useRef(mode)
  const sessionRef = useRef(sessionCount)
  const statusRef = useRef(status)

  // Keep refs synchronised
  useEffect(() => { secondsRef.current = secondsLeft }, [secondsLeft])
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { sessionRef.current = sessionCount }, [sessionCount])
  useEffect(() => { statusRef.current = status }, [status])

  // ── Sync state → Electron main process ─────────────
  useEffect(() => {
    window.electronAPI?.updateTimerState({ secondsLeft, mode, status })
  }, [secondsLeft, mode, status])

  // ── Send notification + show window on completion ───
  const notifyComplete = useCallback((completedMode: TimerMode, nextMode: TimerMode) => {
    const api = window.electronAPI
    if (!api) return
    if (completedMode === 'focus') {
      const label = nextMode === 'longBreak' ? '15 分钟长休' : '5 分钟短休'
      api.sendNotification('🎉 专注完成！', `休息一下吧 · 进入${label}`)
    } else {
      api.sendNotification('☕ 休息结束', '开始新的专注吧')
    }
  }, [])

  // ── Derived values ─────────────────────────────────
  const totalSeconds = TIMER_CONFIG[mode].minutes * 60
  const progress = totalSeconds > 0
    ? (totalSeconds - secondsLeft) / totalSeconds
    : 0
  const completedDots = sessionCount % SESSIONS_PER_LONG_BREAK

  // ── Clean interval helper ──────────────────────────
  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // ── Determine next mode after completion ───────────
  const getNextMode = useCallback((currentMode: TimerMode, sessions: number): TimerMode => {
    if (currentMode === 'focus') {
      const next = sessions + 1 // counting this completion
      return next % SESSIONS_PER_LONG_BREAK === 0 ? 'longBreak' : 'shortBreak'
    }
    // After any break, always go back to focus
    return 'focus'
  }, [])

  // ── Handle timer completion ────────────────────────
  const onComplete = useCallback(() => {
    clearTimer()
    playChime()

    const currentMode = modeRef.current
    const currentSessions = sessionRef.current

    if (currentMode === 'focus') {
      // Completed a focus session → increment counter
      const newCount = currentSessions + 1
      setSessionCount(newCount)
      sessionRef.current = newCount
    }

    // Determine and switch to the next mode
    const nextMode = getNextMode(currentMode, currentSessions)
    notifyComplete(currentMode, nextMode)

    setMode(nextMode)
    modeRef.current = nextMode
    setSecondsLeft(TIMER_CONFIG[nextMode].minutes * 60)
    setStatus('running')
    statusRef.current = 'running'

    // Start the next timer immediately (auto-continue)
    intervalRef.current = setInterval(() => {
      const prev = secondsRef.current
      if (prev <= 1) {
        onComplete()
        return
      }
      secondsRef.current = prev - 1
      setSecondsLeft(prev - 1)
    }, 1000)
  }, [clearTimer, getNextMode, notifyComplete])

  // ── Start ──────────────────────────────────────────
  const start = useCallback(() => {
    setStatus('running')
    statusRef.current = 'running'
    clearTimer() // safety: clear any stale interval

    intervalRef.current = setInterval(() => {
      const prev = secondsRef.current
      if (prev <= 1) {
        onComplete()
        return
      }
      secondsRef.current = prev - 1
      setSecondsLeft(prev - 1)
    }, 1000)
  }, [clearTimer, onComplete])

  // ── Pause ──────────────────────────────────────────
  const pause = useCallback(() => {
    clearTimer()
    setStatus('paused')
    statusRef.current = 'paused'
  }, [clearTimer])

  // ── Reset ──────────────────────────────────────────
  const reset = useCallback(() => {
    clearTimer()
    setStatus('idle')
    statusRef.current = 'idle'
    setSecondsLeft(TIMER_CONFIG[mode].minutes * 60)
  }, [clearTimer, mode])

  // ── Switch mode (manual) ───────────────────────────
  const switchMode = useCallback((newMode: TimerMode) => {
    clearTimer()
    setMode(newMode)
    modeRef.current = newMode
    setStatus('idle')
    statusRef.current = 'idle'
    setSecondsLeft(TIMER_CONFIG[newMode].minutes * 60)
  }, [clearTimer])

  // ── Window controls ────────────────────────────────
  const handleClose = useCallback(() => window.electronAPI?.close(), [])
  const handleMinimize = useCallback(() => window.electronAPI?.minimize(), [])

  const handleToggleTop = useCallback(async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.setAlwaysOnTop(!alwaysOnTop)
      setAlwaysOnTop(result)
    } else {
      setAlwaysOnTop(!alwaysOnTop)
    }
  }, [alwaysOnTop])

  // ── Theme ──────────────────────────────────────────
  const handleToggleTheme = useCallback(() => setIsLight(v => !v), [])

  // ── Tray menu IPC listeners ────────────────────────
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onTimerStart(start)
      window.electronAPI.onTimerPause(pause)
      window.electronAPI.onTimerReset(reset)
      return () => {
        window.electronAPI?.removeAllListeners('timer:start')
        window.electronAPI?.removeAllListeners('timer:pause')
        window.electronAPI?.removeAllListeners('timer:reset')
      }
    }
  }, [start, pause, reset])

  // ── Cleanup on unmount ─────────────────────────────
  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  // ── Derived status label ───────────────────────────
  const statusLabel: string = (() => {
    if (status === 'running') {
      return mode === 'focus' ? '专注中…' : '休息中…'
    }
    return STATUS_LABEL[status]
  })()

  // ── Layout ─────────────────────────────────────────
  return (
    <div
      className={`h-full w-full rounded-apple overflow-hidden relative no-select ${isLight ? 'light' : ''}`}
    >
      {/* ── Background ────────────────────────────────── */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: isLight
            ? 'linear-gradient(135deg, #F5F5F7 0%, #ECECF0 50%, #E4E4E8 100%)'
            : 'linear-gradient(135deg, #1c1c1e 0%, #1e1e20 50%, #222224 100%)',
        }}
      />

      {/* Ambient glass */}
      <div className="absolute inset-0 glass-subtle" />

      {/* ── Main content ──────────────────────────────── */}
      <div className="relative h-full flex flex-col items-center justify-between py-7 px-7">

        {/* ── Top bar ─────────────────────────────────── */}
        <div className="drag-region w-full flex items-center justify-between mb-1">
          <WindowControls
            alwaysOnTop={alwaysOnTop}
            onClose={handleClose}
            onMinimize={handleMinimize}
            onToggleTop={handleToggleTop}
          />
          <ThemeToggle isLight={isLight} onToggle={handleToggleTheme} />
        </div>

        {/* ── Mode tabs ────────────────────────────────── */}
        <ModeTabs mode={mode} onSwitch={switchMode} />

        {/* ── Timer ring + time ────────────────────────── */}
        <div className="flex-1 flex items-center justify-center relative">
          <TimerRing
            progress={progress}
            size={242}
            strokeWidth={6}
            isActive={status === 'running'}
            mode={mode}
          />

          {/* Time overlaid at ring centre */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.span
                key={`time-${secondsLeft}`}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="text-[56px] font-extralight tracking-tighter tabular-nums"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
                  letterSpacing: '-0.02em',
                }}
              >
                {formatTime(secondsLeft)}
              </motion.span>
            </AnimatePresence>

            <span
              className="text-[13px] font-medium tracking-[0.12em] uppercase mt-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* ── Session dots ──────────────────────────────── */}
        <SessionDots
          completed={completedDots}
          total={SESSIONS_PER_LONG_BREAK}
          isActive={status === 'running'}
        />

        {/* ── Control buttons ───────────────────────────── */}
        <ControlButtons
          status={status}
          onStart={start}
          onPause={pause}
          onReset={reset}
        />

        {/* ── Keyboard shortcut hint ────────────────────── */}
        <p className="text-[11px] mt-3 drag-region" style={{ color: 'var(--text-tertiary)' }}>
          ⌘/Ctrl + Shift + P 切换窗口
        </p>
      </div>
    </div>
  )
}
