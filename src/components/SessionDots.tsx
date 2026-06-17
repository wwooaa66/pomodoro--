import { motion } from 'framer-motion'

interface SessionDotsProps {
  completed: number   // number of completed sessions
  total: number       // total dots to show
  isActive: boolean   // whether a timer is currently running
}

export default function SessionDots({ completed, total, isActive }: SessionDotsProps) {
  return (
    <div className="flex gap-[7px] mb-2">
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < completed
        return (
          <motion.div
            key={i}
            className="w-[7px] h-[7px] rounded-full"
            style={{
              background: isFilled
                ? 'var(--text-secondary)'
                : 'var(--ring-track)',
            }}
            animate={{
              scale: isActive && i === completed ? [1, 1.5, 1] : 1,
              opacity: isActive && i === completed ? [0.5, 1, 0.5] : 1,
            }}
            transition={{
              repeat: isActive && i === completed ? Infinity : 0,
              duration: 1.8,
              ease: 'easeInOut',
            }}
          />
        )
      })}
    </div>
  )
}
