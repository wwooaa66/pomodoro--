import { motion } from 'framer-motion'
import type { TimerStatus } from '../config'

interface ControlButtonsProps {
  status: TimerStatus
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 17,
}

const buttonHover = {
  scale: 1.06,
  transition: springTransition,
}

const buttonTap = {
  scale: 0.94,
  transition: springTransition,
}

export default function ControlButtons({
  status,
  onStart,
  onPause,
  onReset,
}: ControlButtonsProps) {
  const isRunning = status === 'running'
  const isIdle = status === 'idle'

  return (
    <div className="flex items-center gap-6">
      {/* ── Reset ────────────────────────────────────────── */}
      <motion.button
        whileHover={buttonHover}
        whileTap={buttonTap}
        onClick={onReset}
        className="no-drag w-[42px] h-[42px] rounded-full glass-medium flex items-center justify-center
                   text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
        aria-label="重置"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </motion.button>

      {/* ── Play / Pause (main button) ────────────────────── */}
      <motion.button
        whileHover={buttonHover}
        whileTap={buttonTap}
        onClick={isRunning ? onPause : onStart}
        className="no-drag w-[68px] h-[68px] rounded-full flex items-center justify-center
                   shadow-[0_4px_16px_rgba(0,0,0,0.25)] relative overflow-hidden"
        style={{
          background: isRunning
            ? 'var(--glass-heavy-bg)'
            : 'var(--accent-red)',
          border: isRunning ? '1px solid var(--glass-border-heavy)' : 'none',
        }}
        aria-label={isRunning ? '暂停' : '开始'}
      >
        {/* Subtle inner highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        <motion.div
          key={isRunning ? 'pause' : 'play'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10"
        >
          {isRunning ? (
            /* Pause icon */
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <rect x="5.5" y="3" width="4.5" height="18" rx="1.2" />
              <rect x="14" y="3" width="4.5" height="18" rx="1.2" />
            </svg>
          ) : (
            /* Play icon — slightly offset right to optically center */
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-[2px]">
              <path d="M6.5 3.5L20 12L6.5 20.5Z" />
            </svg>
          )}
        </motion.div>
      </motion.button>

      {/* ── Skip (disabled placeholder) ───────────────────── */}
      <motion.button
        whileHover={buttonHover}
        whileTap={buttonTap}
        disabled
        className="no-drag w-[42px] h-[42px] rounded-full glass-medium flex items-center justify-center
                   text-[var(--text-tertiary)] cursor-not-allowed"
        aria-label="不可用"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
        </svg>
      </motion.button>
    </div>
  )
}
