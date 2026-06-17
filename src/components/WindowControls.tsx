import { motion } from 'framer-motion'

interface WindowControlsProps {
  alwaysOnTop: boolean
  onClose: () => void
  onMinimize: () => void
  onToggleTop: () => void
}

const dotHover = {
  scale: 1.18,
  transition: { type: 'spring', stiffness: 400, damping: 17 },
}

const dotTap = {
  scale: 0.9,
  transition: { type: 'spring', stiffness: 400, damping: 17 },
}

export default function WindowControls({
  alwaysOnTop,
  onClose,
  onMinimize,
  onToggleTop,
}: WindowControlsProps) {
  return (
    <div className="flex gap-2 no-drag">
      {/* Close — red */}
      <motion.button
        onClick={onClose}
        whileHover={dotHover}
        whileTap={dotTap}
        className="w-3 h-3 rounded-full bg-[#FF5F57] relative group"
        aria-label="关闭窗口"
      >
        {/* X icon on hover */}
        <svg
          width="6" height="6" viewBox="0 0 6 6"
          className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" strokeLinecap="round"
        >
          <line x1="1.5" y1="1.5" x2="4.5" y2="4.5" />
          <line x1="4.5" y1="1.5" x2="1.5" y2="4.5" />
        </svg>
      </motion.button>

      {/* Minimize — yellow */}
      <motion.button
        onClick={onMinimize}
        whileHover={dotHover}
        whileTap={dotTap}
        className="w-3 h-3 rounded-full bg-[#FFBD2E] relative group"
        aria-label="最小化窗口"
      >
        {/* − icon on hover */}
        <svg
          width="6" height="6" viewBox="0 0 6 6"
          className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" strokeLinecap="round"
        >
          <line x1="1.5" y1="3" x2="4.5" y2="3" />
        </svg>
      </motion.button>

      {/* Always on Top — green / gray */}
      <motion.button
        onClick={onToggleTop}
        whileHover={dotHover}
        whileTap={dotTap}
        className={`w-3 h-3 rounded-full relative group transition-colors duration-300 ${
          alwaysOnTop ? 'bg-[#30D158]' : 'bg-[#8E8E93]'
        }`}
        aria-label={alwaysOnTop ? '取消置顶' : '窗口置顶'}
      >
        {/* Pin icon on hover */}
        <svg
          width="6" height="6" viewBox="0 0 6 6"
          className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" strokeLinecap="round"
        >
          <line x1="3" y1="1" x2="3" y2="5" />
          <line x1="1.5" y1="3" x2="4.5" y2="3" />
        </svg>
      </motion.button>
    </div>
  )
}
