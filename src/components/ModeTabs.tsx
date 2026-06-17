import { motion } from 'framer-motion'
import type { TimerMode } from '../config'
import { TIMER_CONFIG } from '../config'

interface ModeTabsProps {
  mode: TimerMode
  onSwitch: (mode: TimerMode) => void
}

const MODES: TimerMode[] = ['focus', 'shortBreak', 'longBreak']

export default function ModeTabs({ mode, onSwitch }: ModeTabsProps) {
  return (
    <div className="glass-medium rounded-full p-[3px] flex gap-px no-drag">
      {MODES.map((m) => {
        const isActive = mode === m
        return (
          <button
            key={m}
            onClick={() => onSwitch(m)}
            className={`relative px-5 py-[7px] rounded-full text-[13px] font-medium transition-colors duration-200
              ${isActive
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
          >
            {/* Active indicator — slides with layoutId */}
            {isActive && (
              <motion.div
                layoutId="activeModeTab"
                className="absolute inset-[2px] rounded-full bg-[var(--glass-medium-bg)] shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
                style={{
                  border: '1px solid var(--glass-border-medium)',
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              />
            )}
            <span className="relative z-10">{TIMER_CONFIG[m].label}</span>
          </button>
        )
      })}
    </div>
  )
}
