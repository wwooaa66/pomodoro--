import { motion } from 'framer-motion'
import type { TimerMode } from '../config'

interface TimerRingProps {
  progress: number   // 0–1
  size: number
  strokeWidth: number
  isActive: boolean
  mode: TimerMode
}

const GRADIENTS: Record<TimerMode, { id: string; start: string; end: string; glow: string }> = {
  focus:      { id: 'grad-focus',      start: '#FF5F57', end: '#FF3B30', glow: 'rgba(255,95,87,0.35)' },
  shortBreak: { id: 'grad-shortBreak', start: '#30D158', end: '#34C759', glow: 'rgba(48,209,88,0.35)' },
  longBreak:  { id: 'grad-longBreak',  start: '#64D2FF', end: '#007AFF', glow: 'rgba(100,210,255,0.35)' },
}

export default function TimerRing({
  progress,
  size,
  strokeWidth,
  isActive,
  mode,
}: TimerRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - progress * circumference
  const { id, start, end, glow } = GRADIENTS[mode]

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={{ scale: isActive ? 1 : 0.97 }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    >
      <svg
        width={size}
        height={size}
        className="absolute -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* ── Defs: Gradient + Glow filter ─────────────── */}
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={start} />
            <stop offset="100%" stopColor={end} />
          </linearGradient>

          <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Track ring ────────────────────────────────── */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth={strokeWidth}
        />

        {/* ── Progress ring ─────────────────────────────── */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{
            strokeDashoffset: offset,
            filter: isActive ? `url(#${id}-glow)` : 'none',
          }}
          transition={{
            strokeDashoffset: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
            filter: { duration: 0.5 },
          }}
        />
      </svg>

      {/* ── Glow aura behind ring (active mode) ─────────── */}
      {isActive && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size * 0.82,
            height: size * 0.82,
            background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.div>
  )
}
